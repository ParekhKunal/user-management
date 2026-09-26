import type { Request, Response } from "express";
import * as departmentService from "../services/department.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await departmentService.listDepartments(req.query as never);
  return success(res, 200, "Departments retrieved successfully", data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await departmentService.createDepartment(req.user!, req.body, req);
  return success(res, 201, "Department created successfully", data);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await departmentService.getDepartment(req.params.id);
  return success(res, 200, "Department retrieved successfully", data);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await departmentService.updateDepartment(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Department updated successfully", data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.deleteDepartment(req.user!, req.params.id, req);
  return success(res, 200, "Department deleted successfully");
});

export const employees = asyncHandler(async (req: Request, res: Response) => {
  const data = await departmentService.listDepartmentEmployees(req.params.id);
  return success(res, 200, "Department employees retrieved successfully", data);
});
