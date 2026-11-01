import { phoneSchema } from "./contact";
import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
    role: z.enum(["doctor", "client", "user"]),
    bootstrapKey: z.string().optional(),
    timezone: z.string().optional(),
    whatsappNumber: phoneSchema,
    challengeId: z.string().uuid(),
    code: z.string().regex(/^\d{6}$/),
    captchaToken: z.string().min(1, "CAPTCHA token is required")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
    captchaToken: z.string().min(1, "CAPTCHA token is required")
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  }).optional()
});

export const otpRequestSchema = z.object({ body: z.discriminatedUnion("purpose", [
  z.object({ purpose: z.literal("reset"), identifier: z.string().trim().refine(value => z.string().email().safeParse(value).success || phoneSchema.safeParse(value).success, {
    message: "Enter a valid email address or WhatsApp number with country code, e.g. +919876543210."
  }).transform(value => value.includes("@") ? value.toLowerCase() : value.replace(/[\s()-]/g, "")), channel: z.enum(["email", "whatsapp"]) }),
  z.object({ purpose: z.literal("booking"), identifier: phoneSchema, channel: z.literal("whatsapp") }),
  z.object({ purpose: z.literal("register"), identifier: phoneSchema, channel: z.literal("whatsapp") })
]) });
export const resetPasswordSchema = z.object({ body: z.object({
  challengeId: z.string().uuid("Your verification session is invalid. Please request a new code."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code sent to you."),
  password: z.string().min(8, "Your new password must contain at least 8 characters.").max(128, "Your new password must contain no more than 128 characters.")
}) });
