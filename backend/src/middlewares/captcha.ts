import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { env } from "../config/env";

export const validateCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const secret = env.turnstileSecretKey;
  if (!secret) {
    return next();
  }

  const token = req.body?.captchaToken;
  if (!token) {
    return next(new AppError("CAPTCHA verification is required.", 400, "CAPTCHA_REQUIRED"));
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: req.ip || ""
      }).toString()
    });

    const data: any = await response.json();
    if (!data.success) {
      return next(new AppError("CAPTCHA verification failed. Please try again.", 400, "CAPTCHA_FAILED"));
    }

    next();
  } catch (err) {
    next(err);
  }
};
