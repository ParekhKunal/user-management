import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "../models/user.model.js";
import { passwordSchema } from "./auth.validator.js";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("A valid email is required"),
  password: passwordSchema,
  role: z.enum(USER_ROLES).default("user"),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().trim().email("A valid email is required").optional(),
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid user id"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
