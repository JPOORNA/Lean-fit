import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["doctor", "client", "user"]),
    bootstrapKey: z.string().optional(),
    timezone: z.string().optional(),
    whatsappNumber: z.string().min(5, "WhatsApp Number is required"),
    captchaToken: z.string().min(1, "CAPTCHA token is required")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    captchaToken: z.string().min(1, "CAPTCHA token is required")
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  }).optional()
});
