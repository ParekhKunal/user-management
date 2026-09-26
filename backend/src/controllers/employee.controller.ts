import type { Request, Response } from "express";
import * as employeeService from "../services/employee.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.createEmployee(req.user!, req.body, req);
  return success(res, 201, "Employee created successfully", data);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.listEmployees(req.user!, req.query as never);
  return success(res, 200, "Employees retrieved successfully", data);
});

export const listDeleted = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.listEmployees(req.user!, req.query as never, true);
  return success(res, 200, "Deleted employees retrieved successfully", data);
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const csv = await employeeService.exportEmployeesCsv(req.user!, req.query as never);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=employees.csv");
  return res.status(200).send(csv);
});

export const bulk = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.bulkUpdate(req.user!, req.body, req);
  return success(res, 200, "Bulk update completed", data);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.getMyEmployee(req.user!);
  return success(res, 200, "Employee profile retrieved successfully", data);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.employeeId) {
    return success(res, 404, "No employee profile is linked to this account");
  }
  const data = await employeeService.updateEmployee(req.user, req.user.employeeId, req.body, req);
  return success(res, 200, "Employee profile updated successfully", data);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.getEmployee(req.user!, req.params.id);
  return success(res, 200, "Employee retrieved successfully", data);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.updateEmployee(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Employee updated successfully", data);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.updateEmployeeStatus(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Employee status updated successfully", data);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.restoreEmployee(req.user!, req.params.id, req);
  return success(res, 200, "Employee restored successfully", data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.softDeleteEmployee(req.user!, req.params.id, req);
  return success(res, 200, "Employee deleted successfully");
});

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.setAccountActive(req.user!, req.params.id, true, req);
  return success(res, 200, "Employee activated successfully", data);
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.setAccountActive(req.user!, req.params.id, false, req);
  return success(res, 200, "Employee deactivated successfully", data);
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.getEmployeeHistory(req.user!, req.params.id);
  return success(res, 200, "Employee history retrieved successfully", data);
});
