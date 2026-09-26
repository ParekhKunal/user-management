import type { Request, Response } from "express";
import * as auditService from "../services/audit.service.js";
import * as dashboardService from "../services/dashboard.service.js";
import * as organizationService from "../services/organization.service.js";
import * as roleService from "../services/role.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const auditLogs = asyncHandler(async (req: Request, res: Response) => {
  const data = await auditService.listAuditLogs(req.query as never);
  return success(res, 200, "Audit logs retrieved successfully", data);
});

export const dashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getSummary(req.user!);
  return success(res, 200, "Dashboard summary retrieved successfully", data);
});

export const dashboardActivity = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getRecentActivity(req.user!);
  return success(res, 200, "Recent activity retrieved successfully", data);
});

export const dashboardTeam = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getTeamSummary(req.user!);
  return success(res, 200, "Team summary retrieved successfully", data);
});

export const organizationTree = asyncHandler(async (_req: Request, res: Response) => {
  const data = await organizationService.getOrganizationTree();
  return success(res, 200, "Organization tree retrieved successfully", data);
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await organizationService.getOrganizationSettings();
  return success(res, 200, "Organization settings retrieved successfully", data);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.updateOrganizationSettings(req.user!, req.body, req);
  return success(res, 200, "Organization settings updated successfully", data);
});

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const data = await roleService.listRoles();
  return success(res, 200, "Roles retrieved successfully", data);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const data = await roleService.createRole(req.user!, req.body, req);
  return success(res, 201, "Role created successfully", data);
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const data = await roleService.getRole(req.params.id);
  return success(res, 200, "Role retrieved successfully", data);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const data = await roleService.updateRole(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Role updated successfully", data);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await roleService.deleteRole(req.user!, req.params.id, req);
  return success(res, 200, "Role deleted successfully");
});

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await roleService.listPermissions();
  return success(res, 200, "Permissions retrieved successfully", data);
});

export const replaceRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const data = await roleService.replaceRolePermissions(req.user!, req.params.id, req.body.permissions, req);
  return success(res, 200, "Role permissions updated successfully", data);
});

export const resetRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const data = await roleService.resetRolePermissions(req.user!, req.params.id, req);
  return success(res, 200, "Role permissions reset to defaults", data);
});
