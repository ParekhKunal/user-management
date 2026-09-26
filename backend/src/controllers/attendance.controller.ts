import type { Request, Response } from "express";
import * as attendanceService from "../services/attendance.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const clockIn = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.clockIn(req.user!, req);
  return success(res, 200, "Clocked in successfully", data);
});

export const clockOut = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.clockOut(req.user!, req);
  return success(res, 200, "Clocked out successfully", data);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listMyAttendance(req.user!, req.query as never);
  return success(res, 200, "Attendance retrieved successfully", data);
});

export const listTeam = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listTeamAttendance(req.user!, req.query as never);
  return success(res, 200, "Team attendance retrieved successfully", data);
});

export const listEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listEmployeeAttendance(
    req.user!,
    req.params.employeeId,
    req.query as never
  );
  return success(res, 200, "Employee attendance retrieved successfully", data);
});
