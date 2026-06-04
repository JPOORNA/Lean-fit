import { z } from "zod";

export const metricsSchema = z.object({
  body: z.object({
    weekStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    weight: z.number().positive(),
    height: z.number().positive(),
    bmi: z.number().positive(),
    extraFields: z.record(z.union([z.string(), z.number()])).optional()
  })
});
