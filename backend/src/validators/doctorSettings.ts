import { z } from "zod";

const hhmmRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const timeRange = z.object({
  start: z.string().regex(hhmmRegex),
  end: z.string().regex(hhmmRegex)
}).refine((val) => val.start < val.end, {
  message: "start must be before end",
  path: ["end"]
});

const holidayRange = z.object({
  date: z.string().regex(dateRegex, { message: "Invalid date format, expected YYYY-MM-DD" }),
  isFullDay: z.boolean(),
  start: z.string().regex(hhmmRegex).optional().nullable(),
  end: z.string().regex(hhmmRegex).optional().nullable(),
  note: z.string().optional().nullable()
}).superRefine((val, ctx) => {
  if (val.isFullDay) return;
  if (!val.start || !val.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "start and end are required for partial-day holidays",
      path: ["start"]
    });
    return;
  }
  if (val.start >= val.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "start must be before end",
      path: ["end"]
    });
  }
});

const blockedSlot = z.object({
  start: z.string(),
  end: z.string(),
  reason: z.string().optional().nullable()
}).refine((val) => {
  const s = new Date(val.start).getTime();
  const e = new Date(val.end).getTime();
  return !isNaN(s) && !isNaN(e) && e > s;
}, {
  message: "end must be after start and dates must be valid",
  path: ["end"]
});

export const upsertSchema = z.object({
  body: z.object({
    timezone: z.string().optional(),
    weeklyAvailability: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        workingHours: z.array(timeRange)
      })
    ).optional(),
    breaks: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        start: z.string().regex(hhmmRegex),
        end: z.string().regex(hhmmRegex)
      }).refine((val) => val.start < val.end, {
        message: "start must be before end",
        path: ["end"]
      })
    ).optional(),
    holidays: z.array(holidayRange).optional(),
    blockedSlots: z.array(blockedSlot).optional(),
    defaultSlotDurationMinutes: z.number().min(10).optional(),
    appointmentFeePaise: z.number().min(0).optional(),
    dynamicMetricFields: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["number", "text"])
      })
    ).optional()
  })
});

export const holidaySchema = z.object({
  body: holidayRange
});

export const breakSchema = z.object({
  body: z.object({
    dayOfWeek: z.number().min(0).max(6),
    start: z.string().regex(hhmmRegex),
    end: z.string().regex(hhmmRegex)
  }).refine((val) => val.start < val.end, {
    message: "start must be before end",
    path: ["end"]
  })
});

export const blockSchema = z.object({
  body: blockedSlot
});
