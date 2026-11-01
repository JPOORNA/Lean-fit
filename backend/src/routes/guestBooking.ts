import { ContactIdentityService } from "../services/ContactIdentityService";
import { DoctorSettings } from "../models/DoctorSettings";
import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { AppointmentController } from "../controllers/AppointmentController";
import { AppointmentService } from "../services/AppointmentService";
import { PaymentService } from "../services/PaymentService";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { Payment } from "../models/Payment";
import { OtpService, normalizeEmail, normalizePhone } from "../services/OtpService";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { phoneSchema } from "../validators/contact";

const router = Router();
router.use(rateLimit({ windowMs: 15 * 60000, max: 30 }));
router.get("/settings", asyncHandler(async (_req, res) => {
  const settings = await DoctorSettings.findOne();
  res.json({ settings: { timezone: settings?.timezone || "UTC", appointmentFeePaise: settings?.appointmentFeePaise ?? env.appointmentFeePaise } });
}));
router.get("/slots", validate(z.object({ query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) })), asyncHandler(AppointmentController.listAvailableSlots));
router.post("/", validate(z.object({ body: z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email(), whatsappNumber: phoneSchema,
  startTime: z.string().datetime(), endTime: z.string().datetime(), challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/), acceptedPolicies: z.literal(true),
  timezone: z.string().refine(value => { try { Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } })
}).refine(body => new Date(body.endTime) > new Date(body.startTime), { message: "End time must be after start time" }) })), asyncHandler(async (req, res) => {
  const data = req.body;
  const email = normalizeEmail(data.email);
  let user = await User.findOne({ email });
  if (user && !user.isActive) throw new AppError("Contact support to book", 403, "INACTIVE_ACCOUNT");
  if (user && normalizePhone(user.whatsappNumber || "") !== data.whatsappNumber) throw new AppError("Use the WhatsApp number associated with this email, or contact support.", 409, "CONTACT_MISMATCH");
  await ContactIdentityService.assertPhoneAvailable(data.whatsappNumber, user?.id);
  await OtpService.consume(data.challengeId, data.code, "booking", data.whatsappNumber, "whatsapp");
  if (!user) {
    try {
      user = await User.create({ name: data.name.trim(), email, whatsappNumber: data.whatsappNumber.replace(/[\s()-]/g, ""), timezone: data.timezone,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12), isGuest: true, role: "user" });
    } catch (error: any) {
      if (error.code !== 11000) throw error;
      user = await User.findOne({ email });
      if (!user || !user.isActive || normalizePhone(user.whatsappNumber || "") !== data.whatsappNumber) throw new AppError("Unable to book", 409, "IDENTITY_CONFLICT");
    }
  }
  const appointment = await AppointmentService.book(user.id, new Date(data.startTime), new Date(data.endTime));
  try {
    const { order } = await PaymentService.createOrder(user.id, appointment.id);
    const bookingToken = jwt.sign({ sub: user.id, appointmentId: appointment.id, scope: "guest-payment" }, env.jwtAccessSecret, { expiresIn: "1h" });
    res.status(201).json({ order, bookingToken, keyId: env.razorpayKeyId });
  } catch (error) {
    await Appointment.updateOne({ _id: appointment.id, paymentStatus: "pending" }, { $set: { sessionStatus: "cancelled", paymentStatus: "failed" } });
    throw error;
  }
}));
router.post("/verify", validate(z.object({ body: z.object({ bookingToken: z.string().max(2000), orderId: z.string().min(1), paymentId: z.string().min(1), signature: z.string().regex(/^[a-f0-9]{64}$/) }) })), asyncHandler(async (req, res) => {
  let token: jwt.JwtPayload;
  try { token = jwt.verify(req.body.bookingToken, env.jwtAccessSecret) as jwt.JwtPayload; }
  catch { throw new AppError("Booking session expired", 401, "UNAUTHORIZED"); }
  if (token.scope !== "guest-payment" || !token.sub || !token.appointmentId) throw new AppError("Invalid booking session", 401, "UNAUTHORIZED");
  const payment = await Payment.findOne({ orderId: req.body.orderId, userId: token.sub, appointmentId: token.appointmentId });
  if (!payment) throw new AppError("Payment not found", 404, "NOT_FOUND");
  await PaymentService.verifyPayment(token.sub, req.body);
  res.json({ message: "Payment successful. Your consultation is confirmed." });
}));
export { router as guestBookingRoutes };
