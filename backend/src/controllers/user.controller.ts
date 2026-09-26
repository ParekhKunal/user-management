import type { Request, Response } from "express";
import * as userService from "../services/user.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.user!, req.body);
  return success(res, 201, "User created successfully", user);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.listUsers(req.query as never);
  return success(res, 200, "Users retrieved successfully", data);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.id);
  return success(res, 200, "Profile retrieved successfully", user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.id, req.body);
  return success(res, 200, "Profile updated successfully", user);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  return success(res, 200, "User retrieved successfully", user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.user!, req.params.id, req.body);
  return success(res, 200, "User updated successfully", user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(req.user!, req.params.id);
  return success(res, 200, "User deleted successfully");
});

export const listPendingUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listPendingUsers();
  return success(res, 200, "Pending users retrieved successfully", users);
});

export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.approveUser(req.user!, req.params.id);
  return success(res, 200, "User approved successfully", user);
});

export const rejectUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.rejectUser(req.user!, req.params.id);
  return success(res, 200, "User rejected successfully", user);
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await userService.getDashboardStats();
  return success(res, 200, "Dashboard stats retrieved successfully", data);
});
