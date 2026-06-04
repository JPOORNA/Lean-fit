import { z } from "zod";

export const updateSubscriptionSchema = z.object({
  params: z.object({
    userId: z.string()
  }),
  body: z.object({
    clientExpiresAt: z.string()
  })
});

export const updateRoleSchema = z.object({
  params: z.object({
    userId: z.string()
  }),
  body: z.object({
    role: z.enum(["client", "user", "doctor"]),
    clientExpiresAt: z.string().optional(),
    purgeData: z.boolean().optional()
  })
});

export const clientMealStatusSchema = z.object({
  params: z.object({
    userId: z.string()
  }),
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
});
