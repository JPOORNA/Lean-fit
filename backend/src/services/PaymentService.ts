import crypto from "crypto";
import { razorpayClient } from "../config/razorpay";
import { env } from "../config/env";
import { Appointment } from "../models/Appointment";
import { DoctorSettings } from "../models/DoctorSettings";
import { GroupSessionSlot } from "../models/GroupSessionSlot";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { AppError } from "../utils/errors";
import { GroupSessionService } from "./GroupSessionService";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { GroupSessionSlotRepository } from "../repositories/GroupSessionSlotRepository";
import { Payment } from "../models/Payment";

export const PaymentService = {
  async createOrder(userId: string, appointmentId: string) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    if (appointment.userId.toString() !== userId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    if (appointment.paymentStatus !== "pending") {
      throw new AppError("Payment not required", 409, "PAYMENT_NOT_REQUIRED");
    }

    if (appointment.createdAt.getTime() < Date.now() - 60 * 60 * 1000) {
      appointment.paymentStatus = "failed";
      await appointment.save();
      throw new AppError("Payment window expired. Please book the slot again.", 409, "PAYMENT_WINDOW_EXPIRED");
    }

    const existingPending = await Payment.findOne({
      appointmentId: appointment.id,
      userId,
      paymentType: "appointment",
      status: { $in: ["created", "paid"] }
    }).sort({ createdAt: -1 });
    if (existingPending) {
      throw new AppError("Payment order already exists for this appointment", 409, "PAYMENT_IN_PROGRESS");
    }

    const settings = await DoctorSettings.findOne({ doctorId: appointment.doctorId });
    const configuredAmount = settings?.appointmentFeePaise ?? env.appointmentFeePaise;
    const amount = Math.max(0, Math.round(configuredAmount));
    const order = await razorpayClient.orders.create({
      amount,
      currency: "INR",
      receipt: appointment.id
    });

    const payment = await PaymentRepository.create({
      appointmentId: appointment.id,
      userId,
      amount,
      currency: "INR",
      orderId: order.id,
      paymentType: "appointment",
      status: "created",
      rawPayload: order
    });

    return { order, payment };
  },

  async createGroupOrder(userId: string, groupSessionSlotId: string) {
    const slot = await GroupSessionSlot.findById(groupSessionSlotId);
    if (!slot || slot.status !== "scheduled") {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }

    if (slot.bookedUserIds.some((id) => id.toString() === userId)) {
      throw new AppError("Already booked", 409, "ALREADY_BOOKED");
    }

    if (slot.bookedUserIds.length >= slot.maxPeople) {
      throw new AppError("Group session is full", 409, "GROUP_FULL");
    }

    const appointmentOverlap = await AppointmentRepository.findOverlappingForUser(
      userId,
      slot.startTime,
      slot.endTime
    );
    if (appointmentOverlap) {
      throw new AppError("Slot overlaps with an existing appointment", 409, "SLOT_TAKEN");
    }

    const groupOverlap = await GroupSessionSlotRepository.findOverlappingForUser(
      userId,
      slot.startTime,
      slot.endTime
    );
    if (groupOverlap) {
      throw new AppError("Slot overlaps with another group session", 409, "SLOT_TAKEN");
    }

    const amount = Math.max(0, Math.round(slot.pricePaise));
    const order = await razorpayClient.orders.create({
      amount,
      currency: "INR",
      receipt: `group-session-${slot.id}`
    });

    const payment = await PaymentRepository.create({
      groupSessionSlotId: slot.id,
      userId,
      amount,
      currency: "INR",
      orderId: order.id,
      paymentType: "group_session",
      status: "created",
      rawPayload: order
    });

    return { order, payment };
  },

  async verifyPayment(userId: string, payload: { orderId: string; paymentId: string; signature: string }) {
    const payment = await PaymentRepository.findByOrderId(payload.orderId);
    if (!payment) {
      throw new AppError("Payment not found", 404, "NOT_FOUND");
    }

    if (payment.userId.toString() !== userId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const expected = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(`${payload.orderId}|${payload.paymentId}`)
      .digest("hex");

    if (expected !== payload.signature) {
      throw new AppError("Invalid signature", 400, "INVALID_SIGNATURE");
    }

    if (payment.status === "paid") {
      await Appointment.findByIdAndUpdate(payment.appointmentId, { paymentStatus: "paid" });
      return payment;
    }

    payment.paymentId = payload.paymentId;
    payment.signature = payload.signature;
    payment.status = "paid";
    try {
      await payment.save();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
        const existing = await PaymentRepository.findByOrderId(payload.orderId);
        if (existing?.status === "paid") {
          await Appointment.findByIdAndUpdate(existing.appointmentId, { paymentStatus: "paid" });
          return existing;
        }
      }
      throw err;
    }

    await Appointment.findByIdAndUpdate(payment.appointmentId, { paymentStatus: "paid" });

    return payment;
  },

  async verifyGroupPayment(userId: string, payload: { orderId: string; paymentId: string; signature: string }) {
    const payment = await PaymentRepository.findByOrderId(payload.orderId);
    if (!payment || payment.paymentType !== "group_session") {
      throw new AppError("Payment not found", 404, "NOT_FOUND");
    }

    if (payment.userId.toString() !== userId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const expected = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(`${payload.orderId}|${payload.paymentId}`)
      .digest("hex");

    if (expected !== payload.signature) {
      throw new AppError("Invalid signature", 400, "INVALID_SIGNATURE");
    }

    if (payment.status === "paid") {
      if (!payment.groupSessionSlotId) {
        throw new AppError("Group session missing", 409, "MISSING_DATA");
      }
      const slot = await GroupSessionSlot.findById(payment.groupSessionSlotId);
      if (slot?.bookedUserIds.some((id) => id.toString() === userId)) {
        return payment;
      }
    }

    payment.paymentId = payload.paymentId;
    payment.signature = payload.signature;
    payment.status = "paid";
    try {
      await payment.save();
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
        const existing = await PaymentRepository.findByOrderId(payload.orderId);
        if (existing?.status === "paid") {
          if (!existing.groupSessionSlotId) {
            throw new AppError("Group session missing", 409, "MISSING_DATA");
          }
          const slot = await GroupSessionSlot.findById(existing.groupSessionSlotId);
          if (slot?.bookedUserIds.some((id) => id.toString() === userId)) {
            return existing;
          }
        }
      }
      throw err;
    }

    if (!payment.groupSessionSlotId) {
      throw new AppError("Group session missing", 409, "MISSING_DATA");
    }

    try {
      await GroupSessionService.bookSlot(userId, payment.groupSessionSlotId.toString());
    } catch (err) {
      const slotAfterAttempt = await GroupSessionSlot.findById(payment.groupSessionSlotId);
      if (slotAfterAttempt?.bookedUserIds.some((id) => id.toString() === userId)) {
        return payment;
      }
      throw new AppError(
        "Payment received but booking failed. Contact support for a refund.",
        409,
        "BOOKING_FAILED"
      );
    }

    return payment;
  },

  async refreshPaymentStatus(appointmentId: string) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    
    const payment = await PaymentRepository.findByAppointmentId(appointmentId);
    if (!payment) {
      if (appointment.type === "client_session" && appointment.paymentStatus !== "paid") {
        appointment.paymentStatus = "paid";
        await appointment.save();
      }
      return appointment;
    }

    if (payment.status !== "paid" && payment.orderId) {
      try {
        const orderPayments = await razorpayClient.orders.fetchPayments(payment.orderId);
        const captured = orderPayments.items.find(p => p.status === "captured" || p.status === "authorized");
        if (captured) {
          payment.paymentId = captured.id;
          payment.status = "paid";
          await payment.save();
          appointment.paymentStatus = "paid";
          await appointment.save();
        } else {
          const failed = orderPayments.items.find(p => p.status === "failed");
          if (failed) {
            payment.paymentId = failed.id;
            payment.status = "failed";
            await payment.save();
            appointment.paymentStatus = "failed";
            await appointment.save();
          }
        }
      } catch (err) {
        console.error("Failed to fetch razorpay payments", err);
      }
    }
    return appointment;
  },

  async refreshGroupPaymentStatus(groupSessionSlotId: string, userId: string) {
    const slot = await GroupSessionSlot.findById(groupSessionSlotId);
    if (!slot) throw new AppError("Group session not found", 404, "NOT_FOUND");

    const payment = await PaymentRepository.findGroupSessionPaymentForUser(groupSessionSlotId, userId);
    if (!payment) {
      throw new AppError("Payment not found", 404, "NOT_FOUND");
    }

    if (payment.status !== "paid" && payment.orderId) {
      try {
        const orderPayments = await razorpayClient.orders.fetchPayments(payment.orderId);
        const captured = orderPayments.items.find(p => p.status === "captured" || p.status === "authorized");
        if (captured) {
          payment.paymentId = captured.id;
          payment.status = "paid";
          await payment.save();

          if (slot.bookedUserIds.some((id) => id.toString() === userId)) {
            return payment;
          }

          await GroupSessionService.bookSlot(userId, slot.id);
        } else {
          const failed = orderPayments.items.find(p => p.status === "failed");
          if (failed) {
            payment.paymentId = failed.id;
            payment.status = "failed";
            await payment.save();
          }
        }
      } catch (err) {
        console.error("Failed to fetch razorpay payments", err);
      }
    }

    return payment;
  },

  async manualUpdatePaymentStatus(appointmentId: string, status: "pending" | "paid" | "failed" | "refunded") {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");

    if (appointment.type === "client_session" && status !== "paid") {
      throw new AppError("Client sessions must always be marked as paid", 400, "INVALID_STATUS");
    }

    appointment.paymentStatus = status;
    await appointment.save();
    return appointment;
  },

  async manualUpdateGroupPaymentStatus(paymentId: string, status: "created" | "paid" | "failed" | "refunded") {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment || payment.paymentType !== "group_session") {
      throw new AppError("Payment not found", 404, "NOT_FOUND");
    }

    payment.status = status;
    await payment.save();
    return payment;
  },

  async listAllPayments() {
    return await PaymentRepository.findAll();
  },

  async initiateRefund(paymentRecordId: string) {
    const payment = await PaymentRepository.findById(paymentRecordId);
    if (!payment) throw new AppError("Payment record not found", 404, "NOT_FOUND");
    if (payment.status !== "paid") throw new AppError("Only paid payments can be refunded", 400, "INVALID_STATUS");
    if (!payment.paymentId) throw new AppError("No payment ID found for this record", 400, "MISSING_DATA");

    try {
      const refund = await razorpayClient.payments.refund(payment.paymentId, {
        amount: payment.amount,
        notes: { reason: "Doctor initiated refund" }
      });

      payment.status = "refunded";
      payment.rawPayload = { ...(payment.rawPayload || {}), refund };
      await payment.save();
      await Appointment.findByIdAndUpdate(payment.appointmentId, { paymentStatus: "refunded" });

      return payment;
    } catch (err: any) {
      console.error("Razorpay refund error:", err);
      throw new AppError(err.error?.description || err.message || "Failed to initiate refund with Razorpay", 500, "PAYMENT_PROVIDER_ERROR");
    }
  }
};
