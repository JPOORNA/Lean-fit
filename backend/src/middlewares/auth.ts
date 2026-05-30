import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { AppError } from "../utils/errors";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const payload = jwt.verify(token, env.jwtAccessSecret) as { sub: string };
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (user.role === "client" && user.clientExpiresAt && user.clientExpiresAt.getTime() <= Date.now()) {
      user.role = "user";
      await user.save();
    }

    req.user = user;
    next();
  } catch (err) {
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    next();
  };
};
