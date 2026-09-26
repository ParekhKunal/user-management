import { z } from "zod";
import { LEAVE_STATUSES } from "../constants/employment.js";
import { objectId, paginationSchema } from "./common.validator.js";

export const createLeaveSchema = z
  .object({
    leaveTypeId: objectId,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().min(2, "Reason is required"),
  })
  .refine((data) => data.endDate.getTime() >= data.startDate.getTime(), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const reviewLeaveSchema = z.object({
  reviewComment: z.string().trim().optional().default(""),
});

export const listLeavesQuerySchema = paginationSchema.extend({
  status: z.enum(LEAVE_STATUSES).optional(),
  employeeId: objectId.optional(),
});

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;
export type ListLeavesQuery = z.infer<typeof listLeavesQuerySchema>;
