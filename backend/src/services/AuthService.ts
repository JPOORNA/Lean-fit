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
  async register(data: { name: string; email: string; password: string; role: Role; bootstrapKey?: string; timezone?: string; whatsappNumber?: string }) {
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
      if (existing) {
        throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
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
    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.role === "client" && user.clientExpiresAt && user.clientExpiresAt.getTime() <= Date.now()) {
      user.role = "user";
    }

    const accessToken = TokenService.signAccessToken(user.id);
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
      if (!user) {
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

      const accessToken = TokenService.signAccessToken(user.id);
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
