import { Request, Response } from "express";
import { User } from "../models/User";
import { AppError } from "../utils/errors";

export const ProfileController = {
  updateProfile: async (req: Request, res: Response) => {
    const { name, timezone } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    
    await user.save();

    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _p, refreshTokens: _r, ...safeUser } = userObj;
    
    res.json({ user: safeUser });
  }
};
