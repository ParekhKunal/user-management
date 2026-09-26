import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "./app-error.js";
import type { UserRole } from "../models/user.model.js";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  role: UserRole;
  type: "refresh";
}

function expiryToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 15 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] ?? 60 * 1000);
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    if (!decoded.sub || !decoded.role) {
      throw unauthorized("Invalid token");
    }
    return decoded;
  } catch {
    throw unauthorized("Invalid or expired token");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    if (!decoded.sub || decoded.type !== "refresh") {
      throw unauthorized("Invalid refresh token");
    }
    return decoded;
  } catch {
    throw unauthorized("Invalid or expired refresh token");
  }
}

export function getRefreshTokenMaxAgeMs(): number {
  return expiryToMs(env.REFRESH_TOKEN_EXPIRES_IN);
}
