import mongoose from "mongoose";
import { GroupSessionSlotRepository } from "../repositories/GroupSessionSlotRepository";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { GroupSessionSlot } from "../models/GroupSessionSlot";
import { DoctorSettings } from "../models/DoctorSettings";
import { User } from "../models/User";
import { AppError } from "../utils/errors";

export const GroupSessionService = {
  async createSlot(
    doctorId: string,
    data: { startTime: Date; endTime: Date; pricePaise: number; maxPeople: number }
  ) {
    if (data.startTime.getTime() < Date.now()) {
      throw new AppError("Cannot create group sessions in the past", 400, "PAST_DATE_NOT_ALLOWED");
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
    }

    const settings = await DoctorSettings.findOne();
    if (!settings) {
      throw new AppError("Doctor settings missing", 409, "SETTINGS_MISSING");
    }

    // Group sessions are doctor-decided; skip availability constraints.

    const appointmentOverlap = await AppointmentRepository.findOverlappingForDoctor(
      doctorId,
      data.startTime,
      data.endTime
    );
    if (appointmentOverlap) {
      throw new AppError("Slot overlaps with an existing appointment", 409, "SLOT_TAKEN");
    }

    const groupOverlap = await GroupSessionSlotRepository.findOverlappingForDoctor(
      doctorId,
      data.startTime,
      data.endTime
    );
    if (groupOverlap) {
      throw new AppError("Slot overlaps with another group session", 409, "SLOT_TAKEN");
    }

    return await GroupSessionSlotRepository.create({
      doctorId,
      startTime: data.startTime,
      endTime: data.endTime,
      pricePaise: Math.max(0, Math.round(data.pricePaise)),
      maxPeople: Math.max(1, Math.round(data.maxPeople)),
      bookedUserIds: [],
      status: "scheduled"
    });
  },

  async updateSlot(doctorId: string, slotId: string, data: { pricePaise: number; maxPeople: number }) {
    const slot = await GroupSessionSlotRepository.findById(slotId);
    if (!slot) {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }

    if (slot.doctorId.toString() !== doctorId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const maxPeople = Math.max(1, Math.round(data.maxPeople));
    if (slot.bookedUserIds.length > maxPeople) {
      throw new AppError("Max people is below current bookings", 409, "INVALID_MAX_PEOPLE");
    }

    slot.pricePaise = Math.max(0, Math.round(data.pricePaise));
    slot.maxPeople = maxPeople;
    await slot.save();
    return slot;
  },

  async bookSlot(userId: string, slotId: string) {
    const slot = await GroupSessionSlot.findById(slotId);
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

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const fresh = await GroupSessionSlot.findById(slotId).session(session);
      if (!fresh || fresh.status !== "scheduled") {
        throw new AppError("Group session not found", 404, "NOT_FOUND");
      }

      if (fresh.bookedUserIds.some((id) => id.toString() === userId)) {
        throw new AppError("Already booked", 409, "ALREADY_BOOKED");
      }

      if (fresh.bookedUserIds.length >= fresh.maxPeople) {
        throw new AppError("Group session is full", 409, "GROUP_FULL");
      }

      const appointmentOverlapInTxn = await AppointmentRepository.findOverlappingForUser(
        userId,
        fresh.startTime,
        fresh.endTime,
        session
      );
      if (appointmentOverlapInTxn) {
        throw new AppError("Slot overlaps with an existing appointment", 409, "SLOT_TAKEN");
      }

      const groupOverlapInTxn = await GroupSessionSlot.findOne({
        bookedUserIds: userId,
        status: "scheduled",
        _id: { $ne: fresh._id },
        $or: [
          { startTime: { $lt: fresh.endTime, $gte: fresh.startTime } },
          { endTime: { $gt: fresh.startTime, $lte: fresh.endTime } },
          { startTime: { $lte: fresh.startTime }, endTime: { $gte: fresh.endTime } }
        ]
      }).session(session);
      if (groupOverlapInTxn) {
        throw new AppError("Slot overlaps with another group session", 409, "SLOT_TAKEN");
      }

      fresh.bookedUserIds.push(new mongoose.Types.ObjectId(userId));
      await fresh.save({ session });

      await session.commitTransaction();
      session.endSession();
      return fresh;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  },

  async listAvailableForDate(doctorId: string, start: Date, end: Date, userId?: string) {
    const slots = await GroupSessionSlotRepository.listOverlappingForDoctor(doctorId, start, end);

    const filtered = slots.filter((slot) => slot.bookedUserIds.length < slot.maxPeople);

    if (!userId) return filtered;

    const userAppointments = await AppointmentRepository.listOverlappingForUserRange(userId, start, end);
    const userGroupSlots = await GroupSessionSlotRepository.listOverlappingForUser(userId, start, end);

    return filtered.filter((slot) => {
      const hasAppointmentOverlap = userAppointments.some((appt) =>
        slot.startTime < appt.endTime && slot.endTime > appt.startTime
      );
      const hasGroupOverlap = userGroupSlots.some((group) =>
        slot.startTime < group.endTime && slot.endTime > group.startTime
      );
      return !hasAppointmentOverlap && !hasGroupOverlap;
    });
  },

  async listByDoctor(doctorId: string) {
    return GroupSessionSlotRepository.listByDoctor(doctorId);
  },

  async listByUser(userId: string) {
    return GroupSessionSlotRepository.listByUser(userId);
  },

  async startSlot(doctorId: string, slotId: string) {
    const slot = await GroupSessionSlotRepository.findById(slotId);
    if (!slot) {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }

    if (slot.doctorId.toString() !== doctorId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    if (slot.status === "completed" || slot.status === "cancelled") {
      throw new AppError("Group session already ended", 409, "INVALID_STATUS");
    }

    slot.status = "in_progress";
    await slot.save();
    return slot;
  },

  async endSlot(doctorId: string, slotId: string) {
    const slot = await GroupSessionSlotRepository.findById(slotId);
    if (!slot) {
      throw new AppError("Group session not found", 404, "NOT_FOUND");
    }

    if (slot.doctorId.toString() !== doctorId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    slot.status = "completed";
    await slot.save();
    return slot;
  }
};
