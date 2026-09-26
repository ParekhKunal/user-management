import type { Request, Response } from "express";
import * as employeeService from "../services/employee.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getInvitation = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.getInvitation(String(req.params.token ?? req.query.token ?? ""));
  return success(res, 200, "Invitation retrieved successfully", data);
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.acceptInvitation(req.body);
  return success(res, 200, data.message);
});
