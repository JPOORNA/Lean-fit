import crypto from "crypto";
import { User } from "../models/User";
import { OtpChallenge } from "../models/OtpChallenge";
import { DeliveryService } from "./DeliveryService";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export const normalizePhone = (value: string) => value.trim().replace(/[\s()-]/g, "");

type Purpose = "reset" | "booking" | "register";
const hash = (value: string) => crypto.createHmac("sha256", env.jwtAccessSecret).update(value).digest("hex");
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizeRecoveryIdentifier = (value: string) => value.includes("@") ? normalizeEmail(value) : normalizePhone(value);
export const OtpService = {
  async request(identifier: string, channel: "email" | "whatsapp", purpose: Purpose) {
    if (!env.notificationsEnabled) throw new AppError("Configure SMTP/WhatsApp and enable notifications to send verification codes.", 503, "DELIVERY_DISABLED");
    const phoneVerification = purpose !== "reset";
    if (phoneVerification && channel !== "whatsapp") throw new AppError("Verify your WhatsApp number", 400, "INVALID_CHANNEL");
    identifier = phoneVerification ? normalizePhone(identifier) : normalizeRecoveryIdentifier(identifier);
    if (phoneVerification && !/^\+[1-9]\d{7,14}$/.test(identifier)) throw new AppError("Enter a WhatsApp number with country code", 400, "INVALID_PHONE");
    const emailIdentifier = identifier.includes("@");
    // Shared legacy numbers must not select an arbitrary account for recovery.
    const matches = await User.find({ ...(emailIdentifier ? { email: identifier } : { whatsappNumber: identifier }), isActive: true }).limit(2);
    const user = matches.length === 1 ? matches[0] : undefined;
    const challengeId = crypto.randomUUID();
    const deliverable = phoneVerification || (!!user && (channel === "email" || !!user.whatsappNumber));
    const contactKey = hash(`${purpose === "reset" && user ? user.id : identifier}:${purpose}`);
    const previous = await OtpChallenge.findOne({ contactKey });
    if (previous && previous.createdAt.getTime() > Date.now() - 60000) throw new AppError("Wait a minute before requesting another code", 429, "OTP_RATE_LIMIT");
    const code = crypto.randomInt(100000, 1000000).toString();
    // Keep the cooldown record even if a provider fails; never expose OTPs in logs or responses.
    await OtpChallenge.findOneAndUpdate({ contactKey }, { $set: {
      challengeId, purpose, identifier, channel, codeHash: hash(`${challengeId}:${code}`),
      attempts: 0, userId: user?._id, expiresAt: new Date(Date.now() + 10 * 60000), createdAt: new Date()
    }, $unset: { consumedAt: 1 } }, { upsert: true });
    if (!deliverable) return { challengeId };
    try {
      await DeliveryService.send(channel, phoneVerification ? identifier : channel === "email" ? user!.email : user!.whatsappNumber!, "Leanfit verification code", `Your Leanfit verification code is ${code}. It expires in 10 minutes.`, `otp:${challengeId}`, code);
    } catch (error) {
      await OtpChallenge.updateOne({ challengeId }, { $set: { consumedAt: new Date() } });
      throw error;
    }
    return { challengeId };
  },
  async consume(challengeId: string, code: string, purpose: Purpose, identifier?: string, channel?: "email" | "whatsapp") {
    const challenge = await OtpChallenge.findOneAndUpdate({ challengeId, purpose, consumedAt: null, attempts: { $lt: 5 }, expiresAt: { $gt: new Date() }, ...(channel ? { channel } : {}), ...(identifier ? { identifier: purpose === "reset" ? normalizeRecoveryIdentifier(identifier) : normalizePhone(identifier) } : {}) }, { $inc: { attempts: 1 } }, { new: true });
    const expected = hash(`${challengeId}:${code}`);
    if (!challenge || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(challenge.codeHash))) throw new AppError("Invalid or expired verification code", 400, "INVALID_OTP");
    const consumed = await OtpChallenge.findOneAndUpdate({ _id: challenge._id, consumedAt: null, expiresAt: { $gt: new Date() } }, { $set: { consumedAt: new Date() } }, { new: true });
    if (!consumed) throw new AppError("Verification code already used", 400, "INVALID_OTP");
    return consumed;
  }
};
