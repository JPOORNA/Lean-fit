import { z } from "zod";

export const dietPlanUploadSchema = z.object({
  body: z.object({
    fileUrl: z.string().url().optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
});

export const workoutPlanUploadSchema = z.object({
  body: z.object({
    fileUrl: z.string().url().optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
});
