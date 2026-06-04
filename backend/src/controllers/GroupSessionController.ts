import { Request, Response } from "express";
import { GroupSessionService } from "../services/GroupSessionService";
import { DoctorSettings } from "../models/DoctorSettings";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import { dateKeyInTimezone, endOfDayInTimezone, parseDateTimeInTimezone, startOfDayInTimezone } from "../utils/date";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { GroupSessionSlotRepository } from "../repositories/GroupSessionSlotRepository";
import { GroupSessionSlot } from "../models/GroupSessionSlot";
import { Payment } from "../models/Payment";
import { PaymentService } from "../services/PaymentService";

export const GroupSessionController = {
  create: async (req: Request, res: Response) => {
    const tz = req.user?.timezone ?? "UTC";
    const slot = await GroupSessionService.createSlot(req.user!.id, {
      startTime: parseDateTimeInTimezone(req.body.startTime, tz),
      endTime: parseDateTimeInTimezone(req.body.endTime, tz),
      pricePaise: req.body.pricePaise,
      maxPeople: req.body.maxPeople
    });
    res.status(201).json({ slot });
  },

  update: async (req: Request, res: Response) => {
    const slot = await GroupSessionService.updateSlot(req.user!.id, req.params.id, {
      pricePaise: req.body.pricePaise,
      maxPeople: req.body.maxPeople
    });
    res.json({ slot });
  },

  listMine: async (req: Request, res: Response) => {
    const slots = await GroupSessionService.listByDoctor(req.user!.id);
    res.json({ slots });
  },

  listMyBookings: async (req: Request, res: Response) => {
    const payments = await PaymentRepository.listGroupSessionPaymentsByUser(req.user!.id);
    const bookings = payments
      .filter((payment) => payment.groupSessionSlotId)
      .map((payment) => ({
        payment,
        slot: payment.groupSessionSlotId
      }));
    res.json({ bookings });
  },

  listBookings: async (req: Request, res: Response) => {
    const slot = await GroupSessionSlotRepository.findById(req.params.id);
    if (!slot) {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }
    if (slot.doctorId.toString() !== req.user!.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    const bookings = await PaymentRepository.listByGroupSessionSlotId(req.params.id);
    res.json({ bookings });
  },

  listAvailable: async (req: Request, res: Response) => {
    const doctor = await User.findOne({ role: "doctor" });
    if (!doctor) throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");

    const settings = await DoctorSettings.findOne();
    if (!settings) throw new AppError("Settings not found", 404, "SETTINGS_NOT_FOUND");

    const doctorTz = settings.timezone || "UTC";
    const clientTz = req.user?.timezone || doctorTz;
    const { date } = req.query;

    let rangeStart = new Date();
    let rangeEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (date) {
      const clientDayStart = startOfDayInTimezone(date as string, clientTz);
      const clientDayEnd = endOfDayInTimezone(date as string, clientTz);

      const doctorDateStart = dateKeyInTimezone(clientDayStart, doctorTz);
      const doctorDateEnd = dateKeyInTimezone(clientDayEnd, doctorTz);
      const doctorDates = doctorDateStart === doctorDateEnd ? [doctorDateStart] : [doctorDateStart, doctorDateEnd];

      const doctorDayStarts = doctorDates.map((doctorDate) => startOfDayInTimezone(doctorDate, doctorTz));
      const doctorDayEnds = doctorDates.map((doctorDate) => endOfDayInTimezone(doctorDate, doctorTz));
      rangeStart = new Date(Math.min(...doctorDayStarts.map((d) => d.getTime())));
      rangeEnd = new Date(Math.max(...doctorDayEnds.map((d) => d.getTime())));
    }

    const slots = await GroupSessionService.listAvailableForDate(doctor.id, rangeStart, rangeEnd, req.user?.id);
    const filtered = slots.filter((slot) => slot.startTime >= rangeStart && slot.startTime <= rangeEnd);

    res.json({ slots: filtered });
  },

  book: async (req: Request, res: Response) => {
    const slot = await GroupSessionService.bookSlot(req.user!.id, req.params.id);
    res.json({ slot });
  },

  start: async (req: Request, res: Response) => {
    const slot = await GroupSessionService.startSlot(req.user!.id, req.params.id);
    res.json({ slot });
  },

  end: async (req: Request, res: Response) => {
    const slot = await GroupSessionService.endSlot(req.user!.id, req.params.id);
    res.json({ slot });
  },

  deleteSlot: async (req: Request, res: Response) => {
    const { id } = req.params;
    const refundAll = req.query.refundAll === "true";

    const slot = await GroupSessionSlot.findById(id);
    if (!slot) {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }

    if (slot.doctorId.toString() !== req.user!.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    if (refundAll) {
      const paidPayments = await Payment.find({ groupSessionSlotId: slot._id, status: "paid" });
      for (const payment of paidPayments) {
        try {
          await PaymentService.initiateRefund(payment._id.toString());
        } catch (err) {
          console.error(`Failed to refund payment ${payment._id} for group session ${id}:`, err);
        }
      }
    }

    await GroupSessionSlot.findByIdAndDelete(id);

    res.json({ success: true, message: "Group session slot deleted successfully" });
  },

  deleteBooking: async (req: Request, res: Response) => {
    const { id, userId } = req.params;
    const refund = req.query.refund === "true";

    const slot = await GroupSessionSlot.findById(id);
    if (!slot) {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }

    if (slot.doctorId.toString() !== req.user!.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    slot.bookedUserIds = slot.bookedUserIds.filter((bId) => bId.toString() !== userId);
    await slot.save();

    if (refund) {
      const payment = await Payment.findOne({ groupSessionSlotId: slot._id, userId, status: "paid" });
      if (payment) {
        try {
          await PaymentService.initiateRefund(payment._id.toString());
        } catch (err) {
          console.error(`Failed to refund payment ${payment._id} for group session booking of user ${userId}:`, err);
        }
      }
    }

    res.json({ success: true, message: "Booking removed successfully" });
  }
};
