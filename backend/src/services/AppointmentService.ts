import mongoose from "mongoose";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { Appointment } from "../models/Appointment";
import { DoctorSettings } from "../models/DoctorSettings";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import { ScheduleService } from "./ScheduleService";
import { env } from "../config/env";
import { GroupSessionSlotRepository } from "../repositories/GroupSessionSlotRepository";

const createJitsiRoom = (appointmentId: string) => `client-session-${appointmentId}`;

export const AppointmentService = {
  async book(userId: string, startTime: Date, endTime: Date, type: "one_off" | "client_session" = "one_off") {
    if (startTime.getTime() < Date.now()) {
      throw new AppError("Cannot create appointments in the past", 400, "PAST_DATE_NOT_ALLOWED");
    }

    const doctor = await User.findOne({ role: "doctor" });
    if (!doctor) {
      throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
    }

    const settings = await DoctorSettings.findOne();
    if (!settings) {
      throw new AppError("Doctor settings missing", 409, "SETTINGS_MISSING");
    }

    if (type === "one_off") {
      ScheduleService.assertSlotAllowed(settings, startTime, endTime);
    }

    const groupOverlapForDoctor = await GroupSessionSlotRepository.findOverlappingForDoctor(
      doctor.id,
      startTime,
      endTime
    );
    if (groupOverlapForDoctor) {
      throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
    }

    const groupOverlapForUser = await GroupSessionSlotRepository.findOverlappingForUser(
      userId,
      startTime,
      endTime
    );
    if (groupOverlapForUser) {
      throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const overlap = await AppointmentRepository.findOverlapping(doctor.id, userId, startTime, endTime, session);
      if (overlap) {
        throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
      }

      const appointment = await AppointmentRepository.create(
        {
          doctorId: doctor.id,
          userId,
          startTime,
          endTime,
          paymentStatus: type === "client_session" ? "paid" : "pending",
          sessionStatus: "scheduled",
          type
        },
        session
      );

      const jitsiRoom = createJitsiRoom(appointment.id);
      appointment.jitsiRoom = jitsiRoom;
      appointment.jitsiUrl = `${env.jitsiBaseUrl}/${jitsiRoom}#config.prejoinPageEnabled=false`;
      await appointment.save({ session });

      await session.commitTransaction();
      session.endSession();
      return appointment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
        throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
      }
      throw err;
    }
  },

  async cancel(actor: { id: string; role: string }, appointmentId: string) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    const isOwner = appointment.userId.toString() === actor.id;
    const isDoctor = actor.role === "doctor" && appointment.doctorId.toString() === actor.id;
    if (!isOwner && !isDoctor) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    appointment.sessionStatus = "cancelled";
    await appointment.save();
    return appointment;
  },

  async reschedule(actor: { id: string; role: string }, appointmentId: string, startTime: Date, endTime: Date) {
    if (startTime.getTime() < Date.now()) {
      throw new AppError("Cannot reschedule appointments to the past", 400, "PAST_DATE_NOT_ALLOWED");
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    const isOwner = appointment.userId.toString() === actor.id;
    const isDoctor = actor.role === "doctor" && appointment.doctorId.toString() === actor.id;
    if (!isOwner && !isDoctor) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const doctor = await User.findOne({ role: "doctor" });
    if (!doctor) {
      throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
    }

    const settings = await DoctorSettings.findOne();
    if (!settings) {
      throw new AppError("Doctor settings missing", 409, "SETTINGS_MISSING");
    }

    if (appointment.type === "one_off") {
      ScheduleService.assertSlotAllowed(settings, startTime, endTime);
    }

    const groupOverlapForDoctor = await GroupSessionSlotRepository.findOverlappingForDoctor(
      doctor.id,
      startTime,
      endTime
    );
    if (groupOverlapForDoctor) {
      throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
    }

    const groupOverlapForUser = await GroupSessionSlotRepository.findOverlappingForUser(
      appointment.userId.toString(),
      startTime,
      endTime
    );
    if (groupOverlapForUser) {
      throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
    }

    const overlap = await AppointmentRepository.findOverlapping(doctor.id, appointment.userId.toString(), startTime, endTime);
    if (overlap && overlap.id !== appointmentId) {
      throw new AppError("Slot already booked", 409, "SLOT_TAKEN");
    }

    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.paymentStatus = appointment.type === "client_session" ? "paid" : "pending";
    appointment.sessionStatus = "scheduled";
    await appointment.save();
    return appointment;
  }
};
