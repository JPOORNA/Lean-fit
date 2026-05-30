import { z } from "zod";

const dateOrDateTime = z.string().refine(
  (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value),
  "Invalid date format"
);

export const clientSessionSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).length(3),
    timeSlots: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/)
      })
    ),
    startDate: dateOrDateTime,
    endDate: dateOrDateTime.optional()
  })
});

export const clientSessionUpdateSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)).length(3),
    timeSlots: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/)
      })
    ),
    startDate: dateOrDateTime,
    endDate: dateOrDateTime.optional()
  })
});
