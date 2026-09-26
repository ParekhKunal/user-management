import { z } from "zod";
import { objectId, paginationSchema } from "./common.validator.js";

export const listAttendanceQuerySchema = paginationSchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  employeeId: objectId.optional(),
});

export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
