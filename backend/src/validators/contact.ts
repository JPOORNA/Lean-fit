import { z } from "zod";
export const phoneSchema = z.string().trim().transform(value => value.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a WhatsApp number with country code, e.g. +919876543210"));
