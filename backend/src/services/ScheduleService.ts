import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DoctorSettingsDocument } from "../models/DoctorSettings";
import { AppError } from "../utils/errors";
import { parseDateTimePartsInTimezone } from "../utils/date";

dayjs.extend(utc);
dayjs.extend(timezone);

const isTimeWithin = (start: string, end: string, targetStart: string, targetEnd: string) => {
  return targetStart >= start && targetEnd <= end;
};

const doesTimeOverlap = (start: string, end: string, targetStart: string, targetEnd: string) => {
  return targetStart < end && targetEnd > start;
};

const toMinutes = (hhmm: string) => {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
};

const overlapAbs = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
  return aStart < bEnd && aEnd > bStart;
};

const buildRangeForDay = (start: string, end: string, dayOffsetMinutes = 0) => {
  const startMin = toMinutes(start) + dayOffsetMinutes;
  let endMin = toMinutes(end) + dayOffsetMinutes;
  if (endMin <= startMin) endMin += 24 * 60;
  return { startMin, endMin };
};

const getInTimezone = (date: Date, timezoneValue: string) => {
  try {
    const tz = timezoneValue || "UTC";
    const zoned = dayjs(date).tz(tz);
    return {
      dateStr: zoned.format("YYYY-MM-DD"),
      timeStr: zoned.format("HH:mm"),
      dayOfWeek: zoned.day()
    };
  } catch (err) {
    console.error("[ScheduleService] getInTimezone error:", err);
    const d = dayjs(date);
    return {
      dateStr: d.format("YYYY-MM-DD"),
      timeStr: d.format("HH:mm"),
      dayOfWeek: d.day()
    };
  }
};

export const ScheduleService = {
  assertSlotAllowed(settings: DoctorSettingsDocument, startTime: Date, endTime: Date) {
    const sStart = dayjs(startTime);
    const sEnd = dayjs(endTime);

    if (!sStart.isValid() || !sEnd.isValid() || sEnd.valueOf() <= sStart.valueOf()) {
      throw new AppError("Invalid slot range", 400, "INVALID_SLOT");
    }

    const blocked = (settings.blockedSlots || []).find((slot) => {
      const bStart = dayjs(slot.start);
      const bEnd = dayjs(slot.end);
      return sStart.isBefore(bEnd) && sEnd.isAfter(bStart);
    });

    if (blocked) {
      throw new AppError(`Slot blocked: ${blocked.reason || "No reason"}`, 409, "BLOCKED_SLOT");
    }

    const tz = settings.timezone || "UTC";
    const startLocal = dayjs(startTime).tz(tz);
    const endLocal = dayjs(endTime).tz(tz);
    const { dateStr, dayOfWeek } = getInTimezone(startTime, tz);
    const { dateStr: endDateStr } = getInTimezone(endTime, tz);
    const timeStr = startLocal.format("HH:mm");
    const endTimeStr = endLocal.format("HH:mm");
    const dayDiff = endLocal.startOf("day").diff(startLocal.startOf("day"), "day");
    const slotStartMin = toMinutes(timeStr);
    const slotEndMin = toMinutes(endTimeStr) + (dayDiff > 0 ? dayDiff * 24 * 60 : 0);

    const availabilityToday = (settings.weeklyAvailability || []).find((item) => item.dayOfWeek === dayOfWeek);
    const previousDayOfWeek = (dayOfWeek + 6) % 7;
    const availabilityPrev = (settings.weeklyAvailability || []).find((item) => item.dayOfWeek === previousDayOfWeek);
    const availabilityRanges = [
      ...((availabilityToday?.workingHours || []).map((range) => buildRangeForDay(range.start, range.end, 0))),
      ...((availabilityPrev?.workingHours || [])
        .filter((range) => toMinutes(range.end) <= toMinutes(range.start))
        .map((range) => buildRangeForDay(range.start, range.end, -24 * 60)))
    ];
    if (availabilityRanges.length === 0) {
      throw new AppError("Doctor unavailable on this day", 409, "UNAVAILABLE");
    }

    const withinWorkingHours = availabilityRanges.some((range) =>
      slotStartMin >= range.startMin && slotEndMin <= range.endMin
    );
    if (!withinWorkingHours) {
      throw new AppError(`Outside working hours (${timeStr}-${endTimeStr})`, 409, "OUTSIDE_WORKING_HOURS");
    }

    const breaksToday = (settings.breaks || []).filter((brk) => brk.dayOfWeek === dayOfWeek)
      .map((brk) => buildRangeForDay(brk.start, brk.end, 0));
    const breaksPrev = (settings.breaks || [])
      .filter((brk) => brk.dayOfWeek === previousDayOfWeek && toMinutes(brk.end) <= toMinutes(brk.start))
      .map((brk) => buildRangeForDay(brk.start, brk.end, -24 * 60));
    const inBreak = [...breaksToday, ...breaksPrev].some((range) =>
      overlapAbs(slotStartMin, slotEndMin, range.startMin, range.endMin)
    );
    if (inBreak) {
      throw new AppError("Slot overlaps with break", 409, "BREAK_CONFLICT");
    }

    const holidays = (settings.holidays || []).filter((item) => item.date === dateStr || item.date === endDateStr);
    for (const holiday of holidays) {
      if (holiday.isFullDay) {
        throw new AppError(`Holiday: ${holiday.note || "Public Holiday"}`, 409, "HOLIDAY");
      }
      if (holiday.start && holiday.end) {
        const isStartDateHoliday = holiday.date === dateStr;
        const holidayRange = buildRangeForDay(holiday.start, holiday.end, isStartDateHoliday ? 0 : 24 * 60);
        if (overlapAbs(slotStartMin, slotEndMin, holidayRange.startMin, holidayRange.endMin)) {
          throw new AppError(`Holiday: ${holiday.note || "Public Holiday"}`, 409, "HOLIDAY");
        }
      }
    }
  },

  getAvailableSlots(
    settings: DoctorSettingsDocument,
    dateStr: string,
    existingAppointments: any[],
    existingGroupSessions: any[]
  ) {
    try {
      const tz = settings.timezone || "UTC";
      const duration = settings.defaultSlotDurationMinutes || 30;
      if (duration <= 0) return [];

      const baseDate = dayjs(dateStr);
      if (!baseDate.isValid()) return [];
 
      const testDate = dayjs.tz(`${dateStr} 12:00`, "YYYY-MM-DD HH:mm", tz).toDate();
      const { dayOfWeek } = getInTimezone(testDate, tz);

      const availability = (settings.weeklyAvailability || []).find((item) => item.dayOfWeek === dayOfWeek);
      if (!availability || !availability.workingHours) return [];
      const slots: Array<{ start: string; end: string }> = [];

      for (const range of availability.workingHours) {
        let current = parseDateTimePartsInTimezone(dateStr, range.start, tz);
        let end = parseDateTimePartsInTimezone(dateStr, range.end, tz);
        if (end.getTime() <= current.getTime()) {
          end = dayjs(end).add(1, "day").toDate();
        }

        const maxIterations = Math.ceil((end.getTime() - current.getTime()) / (duration * 60000)) + 1;
        let iterations = 0;
        while (current.getTime() + duration * 60000 <= end.getTime() && iterations < maxIterations) {
          iterations++;
          const slotStart = new Date(current);
          const slotEnd = new Date(current.getTime() + duration * 60000);
          try {
            this.assertSlotAllowed(settings, slotStart, slotEnd);
            const isTaken = (existingAppointments || []).some(a => {
              return dayjs(slotStart).isBefore(dayjs(a.endTime)) && dayjs(slotEnd).isAfter(dayjs(a.startTime));
            }) || (existingGroupSessions || []).some(gs => {
              return dayjs(slotStart).isBefore(dayjs(gs.endTime)) && dayjs(slotEnd).isAfter(dayjs(gs.startTime));
            });
           if (!isTaken) {
              slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString()
              });
            }
          } catch (e) {}

          current = new Date(current.getTime() + duration * 60000);
        }
      }
      return slots;
    } catch (err) {
      console.error("[ScheduleService] getAvailableSlots crash:", err);
      return [];
    }
  }
};
