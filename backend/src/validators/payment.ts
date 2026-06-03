import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    appointmentId: z.string()
  })
});

export const createGroupOrderSchema = z.object({
  body: z.object({
    groupSessionSlotId: z.string()
  })
});

export const verifySchema = z.object({
  body: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    signature: z.string()
  })
});

export const updateGroupPaymentStatusSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    status: z.enum(["created", "paid", "failed", "refunded"])
  })
});
