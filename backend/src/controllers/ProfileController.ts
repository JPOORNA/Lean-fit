import { preferencesFor } from "../services/NotificationService";
import { Request, Response } from "express";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import bcrypt from "bcryptjs";

export const ProfileController = {
  getNotifications: async (req: Request, res: Response) => {
    res.json({ preferences: preferencesFor(req.user!) });
  },
  updateNotifications: async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
    user.notificationPreferences = req.body;
    await user.save();
    res.json({ preferences: preferencesFor(user) });
  },
  updateProfile: async (req: Request, res: Response) => {
    const { name, timezone, whatsappNumber } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (whatsappNumber !== undefined) user.whatsappNumber = whatsappNumber;
    
    await user.save();

    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _p, refreshTokens: _r, ...safeUser } = userObj;
    
    res.json({ user: safeUser });
  },

  changePassword: async (req: Request, res: Response) => {
    const { password, currentPassword } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    if (!await bcrypt.compare(currentPassword, user.passwordHash)) throw new AppError("Current password is incorrect", 400, "INVALID_PASSWORD");
    user.refreshTokens = [];
    user.authVersion = (user.authVersion || 0) + 1;
    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();

    res.clearCookie("accessToken"); res.clearCookie("refreshToken");
    res.json({ message: "Password updated successfully. Please sign in again." });
  }
};
