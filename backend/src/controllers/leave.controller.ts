import type { Request, Response } from "express";
import * as leaveService from "../services/leave.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const types = asyncHandler(async (_req: Request, res: Response) => {
  const data = await leaveService.listLeaveTypes();
  return success(res, 200, "Leave types retrieved successfully", data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.createLeave(req.user!, req.body, req);
  return success(res, 201, "Leave request created successfully", data);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listMyLeaves(req.user!, req.query as never);
  return success(res, 200, "Leave requests retrieved successfully", data);
});

export const listTeam = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listTeamLeaves(req.user!, req.query as never);
  return success(res, 200, "Team leave requests retrieved successfully", data);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.getLeave(req.user!, req.params.id);
  return success(res, 200, "Leave request retrieved successfully", data);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.approveLeave(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Leave approved successfully", data);
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.rejectLeave(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Leave rejected successfully", data);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.cancelLeave(req.user!, req.params.id);
  return success(res, 200, "Leave cancelled successfully", data);
});
