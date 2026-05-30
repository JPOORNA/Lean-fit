import { z } from "zod";

export const bookSchema = z.object({
  body: z.object({
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start time" }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end time" }),
    type: z.enum(["one_off", "client_session"]).optional()
  }).refine((body) => new Date(body.endTime).getTime() > new Date(body.startTime).getTime(), {
    message: "endTime must be after startTime",
    path: ["endTime"]
  })
});

export const rescheduleSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start time" }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end time" })
  }).refine((body) => new Date(body.endTime).getTime() > new Date(body.startTime).getTime(), {
    message: "endTime must be after startTime",
    path: ["endTime"]
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    status: z.enum(["pending_payment", "scheduled", "confirmed", "started", "completed", "cancelled"])
  })
});
