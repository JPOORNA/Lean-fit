import { z } from "zod";

export const workoutSchema = z.object({
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    attended: z.boolean(),
    notes: z.string().optional()
  })
});
