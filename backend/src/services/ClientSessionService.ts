import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ClientSessionSchedule } from "../models/ClientSessionSchedule";
import { AppointmentService } from "./AppointmentService";
import { AppError } from "../utils/errors";
import { User } from "../models/User";
import { DoctorSettings } from "../models/DoctorSettings";
import { parseDateTimeInTimezone, parseDateTimePartsInTimezone, startOfDayInTimezone } from "../utils/date";
import { Appointment } from "../models/Appointment";

dayjs.extend(utc);
dayjs.extend(timezone);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const checkCollisions = async (
  userId: string,
  newSlots: { dayOfWeek: number; startTime: string; endTime: string }[],
  newTz: string,
  excludeScheduleId?: string
) => {
  const query: any = { active: true, userId: { $ne: userId } };
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }
  const activeSchedules = await ClientSessionSchedule.find(query).populate("userId");

  const referenceSundays = [
    dayjs("2026-01-04T00:00:00Z"),
    dayjs("2026-04-05T00:00:00Z"),
    dayjs("2026-07-05T00:00:00Z"),
    dayjs("2026-10-04T00:00:00Z")
  ];

  const getUtcRangesForReferenceWeek = (
    slots: { dayOfWeek: number; startTime: string; endTime: string }[],
    tz: string,
    refSunday: dayjs.Dayjs
  ) => {
    const ranges: { start: number; end: number }[] = [];
    for (const slot of slots) {
      const baseDate = refSunday.add(slot.dayOfWeek, "day").format("YYYY-MM-DD");
      const start = parseDateTimePartsInTimezone(baseDate, slot.startTime, tz);
      let end = parseDateTimePartsInTimezone(baseDate, slot.endTime, tz);
      if (end.getTime() <= start.getTime()) {
        end = dayjs(end).add(1, "day").toDate();
      }
      ranges.push({ start: start.getTime(), end: end.getTime() });
    }
    return ranges;
  };

  for (const schedule of activeSchedules) {
    const scheduleTz = schedule.timezone || "UTC";
    for (const refSunday of referenceSundays) {
      const newRanges = getUtcRangesForReferenceWeek(newSlots, newTz, refSunday);
      const scheduleRanges = getUtcRangesForReferenceWeek(schedule.timeSlots, scheduleTz, refSunday);

      for (const nRange of newRanges) {
        for (const sRange of scheduleRanges) {
          if (nRange.start < sRange.end && nRange.end > sRange.start) {
            const clientName =
              schedule.userId && typeof schedule.userId === "object" && "name" in schedule.userId
                ? (schedule.userId as any).name
                : "another client";
            throw new AppError(
              `Time slot collides with existing session for ${clientName}`,
              400,
              "SCHEDULE_COLLISION"
            );
          }
        }
      }
    }
  }
};

export const ClientSessionService = {
  async createSchedule(
    doctorId: string,
    userId: string,
    data: { daysOfWeek: number[]; timeSlots: { dayOfWeek: number; startTime: string; endTime: string }[]; startDate: string; endDate?: string }
  ) {
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
    }

    const settings = await DoctorSettings.findOne();
    const tz = settings?.timezone || doctor.timezone || "UTC";

    const startDate = DATE_ONLY.test(data.startDate)
      ? startOfDayInTimezone(data.startDate, tz)
      : startOfDayInTimezone(parseDateTimeInTimezone(data.startDate, tz), tz);
    const endDate = data.endDate
      ? (DATE_ONLY.test(data.endDate)
          ? startOfDayInTimezone(data.endDate, tz)
          : startOfDayInTimezone(parseDateTimeInTimezone(data.endDate, tz), tz))
      : undefined;

    if (data.daysOfWeek.length !== 3) {
      throw new AppError("Client sessions must be exactly 3 days per week", 400, "INVALID_SESSION_DAYS");
    }

    const daySet = new Set(data.daysOfWeek);
    const invalidSlots = data.timeSlots.filter((slot) => !daySet.has(slot.dayOfWeek));
    if (invalidSlots.length > 0) {
      throw new AppError("Time slots must match daysOfWeek", 400, "INVALID_SLOTS");
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "client") {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    if (!user.clientExpiresAt) {
      throw new AppError("Client subscription expiry not set", 403, "SUBSCRIPTION_REQUIRED");
    }

    if (user.clientExpiresAt.getTime() <= startDate.getTime()) {
      throw new AppError("Subscription expired", 403, "SUBSCRIPTION_EXPIRED");
    }

    const effectiveEndDate = endDate && endDate.getTime() < user.clientExpiresAt.getTime()
      ? endDate
      : user.clientExpiresAt;

    await checkCollisions(userId, data.timeSlots, tz);

    await ClientSessionSchedule.updateMany({ userId, active: true }, { active: false });
    await Appointment.deleteMany({
      userId,
      type: "client_session",
      startTime: { $gte: new Date() }
    });

    const schedule = await ClientSessionSchedule.create({
      userId,
      daysOfWeek: data.daysOfWeek,
      timeSlots: data.timeSlots,
      startDate,
      endDate: effectiveEndDate,
      timezone: tz,
      active: true
    });

    await this.generateAppointmentsForSchedule(schedule.id, 4);
    return schedule;
  },

  async updateSchedule(
    doctorId: string,
    scheduleId: string,
    data: { daysOfWeek: number[]; timeSlots: { dayOfWeek: number; startTime: string; endTime: string }[]; startDate: string; endDate?: string }
  ) {
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
    }

    const settings = await DoctorSettings.findOne();
    const tz = settings?.timezone || doctor.timezone || "UTC";

    const startDate = DATE_ONLY.test(data.startDate)
      ? startOfDayInTimezone(data.startDate, tz)
      : startOfDayInTimezone(parseDateTimeInTimezone(data.startDate, tz), tz);
    const endDate = data.endDate
      ? (DATE_ONLY.test(data.endDate)
          ? startOfDayInTimezone(data.endDate, tz)
          : startOfDayInTimezone(parseDateTimeInTimezone(data.endDate, tz), tz))
      : undefined;

    if (data.daysOfWeek.length !== 3) {
      throw new AppError("Client sessions must be exactly 3 days per week", 400, "INVALID_SESSION_DAYS");
    }

    const schedule = await ClientSessionSchedule.findById(scheduleId);
    if (!schedule) {
      throw new AppError("Schedule not found", 404, "NOT_FOUND");
    }

    const user = await User.findById(schedule.userId);
    if (!user || user.role !== "client") {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    if (!user.clientExpiresAt) {
      throw new AppError("Client subscription expiry not set", 403, "SUBSCRIPTION_REQUIRED");
    }

    if (user.clientExpiresAt.getTime() <= startDate.getTime()) {
      throw new AppError("Subscription expired", 403, "SUBSCRIPTION_EXPIRED");
    }

    const daySet = new Set(data.daysOfWeek);
    const invalidSlots = data.timeSlots.filter((slot) => !daySet.has(slot.dayOfWeek));
    if (invalidSlots.length > 0) {
      throw new AppError("Time slots must match daysOfWeek", 400, "INVALID_SLOTS");
    }

    const effectiveEndDate = endDate && endDate.getTime() < user.clientExpiresAt.getTime()
      ? endDate
      : user.clientExpiresAt;

    await checkCollisions(schedule.userId.toString(), data.timeSlots, tz, scheduleId);

    await Appointment.deleteMany({
      userId: schedule.userId,
      type: "client_session",
      startTime: { $gte: new Date() }
    });

    schedule.daysOfWeek = data.daysOfWeek;
    schedule.timeSlots = data.timeSlots;
    schedule.startDate = startDate;
    schedule.endDate = effectiveEndDate;
    schedule.timezone = tz;
    schedule.active = true;
    schedule.generatedUntil = undefined;
    await schedule.save();

    await this.generateAppointmentsForSchedule(schedule.id, 4);
    return schedule;
  },

  async generateAppointmentsForSchedule(scheduleId: string, weeksAhead: number) {
    const schedule = await ClientSessionSchedule.findById(scheduleId);
    if (!schedule || !schedule.active) return;

    const user = await User.findById(schedule.userId);
    if (!user || user.role !== "client" || !user.clientExpiresAt) {
      schedule.active = false;
      await schedule.save();
      
      await Appointment.deleteMany({
        userId: schedule.userId,
        type: "client_session",
        startTime: { $gte: new Date() }
      });
      return;
    }

    const tz = schedule.timezone || "UTC";

    const start = dayjs(schedule.generatedUntil ?? schedule.startDate).tz(tz);
    const generatedEnd = start.add(weeksAhead, "week");
    
    const hardEndFromSchedule = schedule.endDate ? dayjs(schedule.endDate).tz(tz) : generatedEnd;
    const hardEndFromUser = dayjs(user.clientExpiresAt).tz(tz);
    const hardEnd = hardEndFromSchedule.isBefore(hardEndFromUser) ? hardEndFromSchedule : hardEndFromUser;
    
    const end = hardEnd.isBefore(generatedEnd) ? hardEnd : generatedEnd;

    for (let cursor = start; cursor.isBefore(end); cursor = cursor.add(1, "day")) {
      const day = cursor.day();
      const slots = schedule.timeSlots.filter((slot) => slot.dayOfWeek === day);
      for (const slot of slots) {
        const dateStr = cursor.format("YYYY-MM-DD");
        const startTime = parseDateTimePartsInTimezone(dateStr, slot.startTime, tz);
        const endTime = parseDateTimePartsInTimezone(dateStr, slot.endTime, tz);
        try {
          await AppointmentService.book(schedule.userId.toString(), startTime, endTime, "client_session");
        } catch (err) {
          continue;
        }
      }
    }

    schedule.generatedUntil = end.toDate();
    await schedule.save();
  },

  listSchedules(userId: string) {
    return ClientSessionSchedule.find({ userId, active: true });
  },

  listAllActiveSchedules() {
    return ClientSessionSchedule.find({ active: true }).populate("userId", "name email");
  }
};
