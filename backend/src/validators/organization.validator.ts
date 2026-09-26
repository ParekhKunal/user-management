import { z } from "zod";
import { ENTITY_STATUSES, WORK_MODES } from "../constants/employment.js";
import { objectId, paginationSchema } from "./common.validator.js";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2),
  code: z.string().trim().min(2).max(16),
  description: z.string().trim().optional().default(""),
  managerId: objectId.optional().nullable(),
  status: z.enum(ENTITY_STATUSES).optional().default("ACTIVE"),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const createTeamSchema = z.object({
  name: z.string().trim().min(2),
  code: z.string().trim().min(2).max(16),
  departmentId: objectId,
  description: z.string().trim().optional().default(""),
  managerId: objectId.optional().nullable(),
  status: z.enum(ENTITY_STATUSES).optional().default("ACTIVE"),
});

export const updateTeamSchema = createTeamSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const listOrgQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  status: z.enum(ENTITY_STATUSES).optional(),
  departmentId: objectId.optional(),
});

export const updateOrganizationSchema = z
  .object({
    organizationName: z.string().trim().min(2).optional(),
    organizationCode: z.string().trim().min(2).max(16).optional(),
    timezone: z.string().trim().optional(),
    country: z.string().trim().optional(),
    defaultWorkMode: z.enum(WORK_MODES).optional(),
    workingDays: z.array(z.number().int().min(0).max(6)).optional(),
    defaultLeavePolicy: z.record(z.string(), z.number()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  permissions: z.array(z.string()).optional(),
});

export const replaceRolePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

export const roleIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/i, "Invalid role id"),
});

export const createRoleSchema = z.object({
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2),
  description: z.string().trim().optional().default(""),
  permissions: z.array(z.string()).default([]),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type ReplaceRolePermissionsInput = z.infer<typeof replaceRolePermissionsSchema>;
