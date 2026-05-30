import { z } from "zod";

export const mealSchema = z.object({
  body: z.object({
    imageUrl: z.string().url().optional(),
    notes: z.string().optional(),
    takenAt: z.string().datetime()
  })
});

export const mealStatusSchema = z.object({
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
});
