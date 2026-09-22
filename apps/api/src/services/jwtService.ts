import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type Role = "CUSTOMER" | "RIDER" | "ADMIN";

export interface AccessTokenPayload {
  sub: string; // subject id (User/Rider/AdminAccount _id)
  role: Role;
  sessionVersion?: number; // used to invalidate all admin sessions on demand
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}
