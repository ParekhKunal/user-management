import type { Request, Response } from "express";
import * as notificationService from "../services/notification.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = String(req.query.unread ?? "") === "true";
  const data = await notificationService.listNotifications(req.user!.id, unreadOnly);
  return success(res, 200, "Notifications retrieved successfully", data);
});

export const readOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationService.markRead(req.user!.id, req.params.id);
  return success(res, 200, "Notification marked as read", data);
});

export const readAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await notificationService.markAllRead(req.user!.id);
  return success(res, 200, "Notifications marked as read", data);
});
