import crypto from "node:crypto";
import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { User, type UserDocument } from "../models/user.model.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  getRefreshTokenMaxAgeMs,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  badRequest,
  conflict,
  forbidden,
  unauthorized,
} from "../utils/app-error.js";
import { writeAudit } from "../utils/audit.js";
import { resolveStoredRolePermissions } from "./role-permissions.js";
import type { ChangePasswordInput, LoginInput, SignupInput } from "../validators/auth.validator.js";
import type { Request } from "express";

const LOGIN_STATUS_MESSAGES: Record<string, string> = {
  pending: "Your account is waiting for administrator approval.",
  rejected: "Your registration has been rejected.",
  inactive: "Your account is inactive. Please contact an administrator.",
  locked: "Your account is locked. Please contact an administrator.",
};

async function publicUser(user: UserDocument) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: await resolveStoredRolePermissions(user.role, user.permissions),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: getRefreshTokenMaxAgeMs(),
  };
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

async function issueTokens(user: UserDocument, res: Response) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + getRefreshTokenMaxAgeMs()),
  });

  res.cookie("refreshToken", refreshToken, refreshCookieOptions());

  return {
    accessToken,
    user: await publicUser(user),
  };
}

export async function signup(input: SignupInput) {
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email, deletedAt: null });
  if (existing) {
    throw conflict("Email already exists", "EMAIL_EXISTS");
  }

  await User.create({
    name: input.name,
    email,
    passwordHash: await hashPassword(input.password),
    role: "user",
    status: "pending",
  });

  return { message: "Registration submitted for approval." };
}

export async function login(input: LoginInput, res: Response, req?: Request) {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email, deletedAt: null }).select("+passwordHash");

  if (!user) {
    await writeAudit({ action: "LOGIN_FAILED", resourceType: "auth", metadata: { email }, req });
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    await writeAudit({
      actorId: user.id,
      action: "LOGIN_FAILED",
      resourceType: "auth",
      resourceId: user.id,
      req,
    });
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.status !== "active") {
    throw forbidden(LOGIN_STATUS_MESSAGES[user.status] ?? "Account is not active", "ACCOUNT_NOT_ACTIVE");
  }

  const tokens = await issueTokens(user, res);
  await writeAudit({ actorId: user.id, action: "LOGIN_SUCCESS", resourceType: "auth", resourceId: user.id, req });
  return tokens;
}

export async function refresh(refreshToken: string | undefined, res: Response) {
  if (!refreshToken) {
    throw unauthorized("Refresh token is required");
  }

  const payload = verifyRefreshToken(refreshToken);
  const stored = await RefreshToken.findOne({
    tokenHash: hashToken(refreshToken),
    revokedAt: null,
  });

  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    clearRefreshCookie(res);
    throw unauthorized("Refresh token is invalid");
  }

  const user = await User.findOne({ _id: payload.sub, deletedAt: null });
  if (!user || user.status !== "active") {
    stored.revokedAt = new Date();
    await stored.save();
    clearRefreshCookie(res);
    throw unauthorized("Account is not active");
  }

  stored.revokedAt = new Date();
  await stored.save();

  return issueTokens(user, res);
}

export async function logout(refreshToken: string | undefined, res: Response, req?: Request) {
  if (refreshToken) {
    await RefreshToken.updateOne(
      { tokenHash: hashToken(refreshToken), revokedAt: null },
      { revokedAt: new Date() }
    );
  }

  clearRefreshCookie(res);
  await writeAudit({
    actorId: req?.user?.id ?? null,
    action: "LOGOUT",
    resourceType: "auth",
    req,
  });
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await User.findOne({ _id: userId, deletedAt: null }).select("+passwordHash");
  if (!user) {
    throw unauthorized("User not found");
  }

  const matches = await comparePassword(input.currentPassword, user.passwordHash);
  if (!matches) {
    throw badRequest("Current password is incorrect", "INVALID_PASSWORD");
  }

  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();

  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
}
