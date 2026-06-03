import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const TokenService = {
  signAccessToken: (userId: string) => {
    return jwt.sign({ sub: userId }, env.jwtAccessSecret, { 
      expiresIn: env.jwtAccessExpiresIn 
    } as any);
  },
  signRefreshToken: (userId: string) => {
    return jwt.sign({ sub: userId }, env.jwtRefreshSecret, { 
      expiresIn: env.jwtRefreshExpiresIn 
    } as any);
  },
  verifyRefreshToken: (token: string) => {
    return jwt.verify(token, env.jwtRefreshSecret) as { sub: string };
  }
};
