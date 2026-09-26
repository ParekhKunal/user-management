import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  return success(res, 201, result.message);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.login(req.body, res, req);
  return success(res, 200, "Login successful", data);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.refresh(req.cookies?.refreshToken as string | undefined, res);
  return success(res, 200, "Token refreshed", data);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.refreshToken as string | undefined, res, req);
  return success(res, 200, "Logged out successfully");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.id, req.body);
  return success(res, 200, "Password changed successfully");
});
