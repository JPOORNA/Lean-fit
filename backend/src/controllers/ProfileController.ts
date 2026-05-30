import { Request, Response } from "express";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import bcrypt from "bcryptjs";

export const ProfileController = {
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
    const { password } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();

    res.json({ message: "Password updated successfully" });
  }
};
