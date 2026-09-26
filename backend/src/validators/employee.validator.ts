import { z } from "zod";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  WORK_MODES,
} from "../constants/employment.js";
import { USER_STATUSES } from "../models/user.model.js";
import { addressSchema, emergencyContactSchema, objectId, paginationSchema } from "./common.validator.js";

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().optional().default(""),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional().default("UNSPECIFIED"),
  joiningDate: z.coerce.date().optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().default("FULL_TIME"),
  jobTitle: z.string().trim().optional().default(""),
  departmentId: objectId.optional().nullable(),
  teamId: objectId.optional().nullable(),
  managerId: objectId.optional().nullable(),
  location: z.string().trim().optional().default(""),
  workMode: z.enum(WORK_MODES).optional().default("HYBRID"),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  invite: z.boolean().optional().default(true),
  password: z.string().min(8).optional(),
  role: z.enum(["employee", "manager", "hr-manager", "admin"]).optional().default("employee"),
});

export const updateEmployeeSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
    profileImage: z.string().trim().optional(),
    dateOfBirth: z.coerce.date().nullable().optional(),
    gender: z.enum(GENDERS).optional(),
    joiningDate: z.coerce.date().nullable().optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    jobTitle: z.string().trim().optional(),
    departmentId: objectId.nullable().optional(),
    teamId: objectId.nullable().optional(),
    managerId: objectId.nullable().optional(),
    location: z.string().trim().optional(),
    workMode: z.enum(WORK_MODES).optional(),
    address: addressSchema.optional(),
    emergencyContact: emergencyContactSchema.optional(),
    reason: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "reason"), {
    message: "At least one field is required",
  });

export const updateEmployeeStatusSchema = z.object({
  employmentStatus: z.enum(EMPLOYMENT_STATUSES),
  reason: z.string().trim().optional().default(""),
});

export const listEmployeesQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  department: objectId.optional(),
  team: objectId.optional(),
  manager: objectId.optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
  accountStatus: z.enum(USER_STATUSES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  location: z.string().trim().optional(),
  joiningFrom: z.coerce.date().optional(),
  joiningTo: z.coerce.date().optional(),
  sort: z.enum(["name", "joiningDate", "employeeCode", "department", "createdAt"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const bulkUpdateSchema = z.object({
  employeeIds: z.array(objectId).min(1).max(100),
  operation: z.enum(["ASSIGN_DEPARTMENT", "ASSIGN_TEAM", "CHANGE_MANAGER", "ACTIVATE", "DEACTIVATE"]),
  value: z.string().optional(),
  reason: z.string().trim().optional(),
});

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(16),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
    phone: z.string().trim().optional(),
    address: addressSchema.optional(),
    emergencyContact: emergencyContactSchema.optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
