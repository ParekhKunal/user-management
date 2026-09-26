import { z } from "zod";

export const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

export const objectIdParamSchema = z.object({
  id: objectId,
});

export const employeeIdParamSchema = z.object({
  employeeId: objectId,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const addressSchema = z.object({
  line1: z.string().trim().optional().default(""),
  line2: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  postalCode: z.string().trim().optional().default(""),
});

export const emergencyContactSchema = z.object({
  name: z.string().trim().optional().default(""),
  relationship: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
});
