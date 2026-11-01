import { ContactIdentityService } from "./ContactIdentityService";
import { OtpService, normalizePhone } from "./OtpService";
import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/UserRepository";
import { Role, UserDocument } from "../models/User";
import { AppError } from "../utils/errors";
import { TokenService } from "./TokenService";
import { hashToken } from "../utils/security";
import { env } from "../config/env";

const sanitizeUser = (user: UserDocument) => {
  const { passwordHash, refreshTokens, ...safeUser } = user.toObject();
  return safeUser;
};

export const AuthService = {
  async register(data: { name: string; email: string; password: string; role: Role; bootstrapKey?: string; timezone?: string; whatsappNumber?: string; challengeId?: string; code?: string }) {
    if (data.role === "doctor") {
      const existingDoctor = await UserRepository.countDoctors();
      if (existingDoctor > 0) {
        throw new AppError("Doctor already exists", 409, "DOCTOR_EXISTS");
      }
      if (!data.bootstrapKey || data.bootstrapKey !== env.adminBootstrapKey) {
        throw new AppError("Invalid bootstrap key", 403, "INVALID_BOOTSTRAP");
      }
    }

    if (data.role === "user" || data.role === "client" || data.role === "doctor") {
      const existing = await UserRepository.findByEmail(data.email);
      if (existing && !existing.isActive) throw new AppError("Contact support to register", 403, "INACTIVE_ACCOUNT");
      if (!data.whatsappNumber || !data.challengeId || !data.code) throw new AppError("Verify your WhatsApp number before creating an account.", 400, "WHATSAPP_VERIFICATION_REQUIRED");
      data.whatsappNumber = normalizePhone(data.whatsappNumber);
      if (existing?.isGuest && normalizePhone(existing.whatsappNumber || "") !== data.whatsappNumber) {
        throw new AppError("Use the WhatsApp number from your previous bookings to link your account, or contact support.", 409, "CONTACT_MISMATCH");
      }
      if (existing && !existing.isGuest) throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
      await ContactIdentityService.assertPhoneAvailable(data.whatsappNumber, existing?.id);
      await OtpService.consume(data.challengeId, data.code, "register", data.whatsappNumber, "whatsapp");
      if (existing?.isGuest) {
        existing.passwordHash = await bcrypt.hash(data.password, 12);
        existing.name = data.name; existing.whatsappNumber = data.whatsappNumber; existing.isGuest = false;
        existing.timezone = data.timezone || existing.timezone;
        existing.refreshTokens = [];
        await existing.save();
        return sanitizeUser(existing);
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await UserRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      timezone: data.timezone || "UTC",
      whatsappNumber: data.whatsappNumber || ""
    } as Partial<UserDocument>);

    return sanitizeUser(user);
  },

  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.isActive || user.isGuest) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.role === "client" && user.clientExpiresAt && user.clientExpiresAt.getTime() <= Date.now()) {
      user.role = "user";
    }

    const accessToken = TokenService.signAccessToken(user.id, user.authVersion || 0);
    const refreshToken = TokenService.signRefreshToken(user.id);
    user.refreshTokens.push(hashToken(refreshToken));
    await user.save();

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      return null;
    }

    try {
      const payload = TokenService.verifyRefreshToken(refreshToken);
      const user = await UserRepository.findById(payload.sub);
      if (!user || !user.isActive || user.isGuest) {
        return null;
      }

      const hashed = hashToken(refreshToken);
      if (!user.refreshTokens.includes(hashed)) {
        return null;
      }

      if (user.role === "client" && user.clientExpiresAt && user.clientExpiresAt.getTime() <= Date.now()) {
        user.role = "user";
        await user.save();
      }

      const accessToken = TokenService.signAccessToken(user.id, user.authVersion || 0);
      return { user: sanitizeUser(user), accessToken };
    } catch (err) {
      return null;
    }
  },

  async logout(userId: string, refreshToken?: string) {
    const user = await UserRepository.findById(userId);
    if (!user) return;

    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      user.refreshTokens = user.refreshTokens.filter((token) => token !== hashed);
    } else {
      user.refreshTokens = [];
    }
    await user.save();
  }
};
