import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const ISO_WITH_OFFSET = /[zZ]|[+-]\d\d:\d\d$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const normalizeTz = (tz?: string) => (tz && tz.trim() ? tz : "UTC");

export const toUtcDate = (value: string | Date) => {
  return dayjs(value).utc().toDate();
};

export const dateKeyInTimezone = (value: string | Date, tz?: string) => {
  return dayjs(value).tz(normalizeTz(tz)).format("YYYY-MM-DD");
};

export const startOfDayInTimezone = (value: string | Date, tz?: string) => {
  const zone = normalizeTz(tz);
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return dayjs.tz(value, "YYYY-MM-DD", zone).startOf("day").toDate();
  }
  return dayjs(value).tz(zone).startOf("day").toDate();
};

export const endOfDayInTimezone = (value: string | Date, tz?: string) => {
  const zone = normalizeTz(tz);
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return dayjs.tz(value, "YYYY-MM-DD", zone).endOf("day").toDate();
  }
  return dayjs(value).tz(zone).endOf("day").toDate();
};

export const parseDateTimeInTimezone = (value: string, tz?: string) => {
  const zone = normalizeTz(tz);
  if (!value) return new Date(value);
  if (ISO_WITH_OFFSET.test(value)) {
    return new Date(value);
  }
  if (value.includes("T")) {
    return dayjs.tz(value, "YYYY-MM-DDTHH:mm", zone).toDate();
  }
  return dayjs.tz(value, "YYYY-MM-DD HH:mm", zone).toDate();
};

export const parseDateOnlyInTimezone = (value: string, tz?: string) => {
  const zone = normalizeTz(tz);
  return dayjs.tz(value, "YYYY-MM-DD", zone).toDate();
};

export const parseDateTimePartsInTimezone = (dateStr: string, timeStr: string, tz?: string) => {
  const zone = normalizeTz(tz);
  return dayjs.tz(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm", zone).toDate();
};
