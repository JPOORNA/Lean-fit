import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { MealLog } from "../models/MealLog";

dayjs.extend(utc);
dayjs.extend(timezone);

const dayRange = (value: Date, tz: string) => {
  const start = dayjs(value).tz(tz).startOf("day").toDate();
  const end = dayjs(value).tz(tz).endOf("day").toDate();
  return { start, end };
};

const enumerateDays = (startDate: Date, endDate: Date, tz: string) => {
  const days: Date[] = [];
  let cursor = dayjs(startDate).tz(tz).startOf("day");
  const end = dayjs(endDate).tz(tz).startOf("day");

  while (cursor.isBefore(end) || cursor.isSame(end)) {
    days.push(cursor.toDate());
    cursor = cursor.add(1, "day");
  }

  return days;
};

export const MealService = {
  create: (userId: string, data: { imageUrl: string; notes?: string; takenAt: Date }) => {
    return MealLog.create({ userId, ...data });
  },
  list: (userId: string) => MealLog.find({ userId }).sort({ takenAt: -1 }),
  listDailyStatus: async (userId: string, startDate: Date, endDate: Date, tz: string) => {
    const { start, end } = dayRange(startDate, tz);
    const rangeEnd = dayRange(endDate, tz).end;
    const logs = await MealLog.find({
      userId,
      takenAt: { $gte: start, $lte: rangeEnd }
    }).sort({ takenAt: 1 });

    const byDay = new Map<string, typeof logs>();
    for (const log of logs) {
      const key = dayjs(log.takenAt).tz(tz).format("YYYY-MM-DD");
      const existing = byDay.get(key);
      if (existing) {
        existing.push(log);
      } else {
        byDay.set(key, [log]);
      }
    }

    return enumerateDays(startDate, endDate, tz).map((day) => {
      const key = dayjs(day).tz(tz).format("YYYY-MM-DD");
      const dayLogs = byDay.get(key) ?? [];
      return {
        date: day,
        status: dayLogs.length > 0 ? "followed" : "not_followed",
        meals: dayLogs
      };
    });
  }
};
