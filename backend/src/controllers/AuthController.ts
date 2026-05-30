import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { env } from "../config/env";

const setAuthCookies = (res: Response, accessToken: string, refreshToken?: string) => {
  const secure = env.cookieSecure || env.nodeEnv === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
    secure,
    path: "/"
  });

  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure,
      path: "/"
    });
  }
};

export const AuthController = {
  register: async (req: Request, res: Response) => {
    const { name, email, password, role, bootstrapKey, timezone } = req.body;
    await AuthService.register({ name, email, password, role, bootstrapKey, timezone });
    res.status(201).json({ message: "Registration successful" });
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user });
  },

  refresh: async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await AuthService.refresh(token);
    
    if (!result) {
      return res.json({ user: null });
    }

    setAuthCookies(res, result.accessToken);
    res.json({ user: result.user });
  },

  logout: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await AuthService.logout(req.user?.id ?? "", refreshToken);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(204).send();
  }
};
