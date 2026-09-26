import { z } from "zod";
import { objectId, paginationSchema } from "./common.validator.js";

export const listAuditQuerySchema = paginationSchema.extend({
  actor: objectId.optional(),
  action: z.string().trim().optional(),
  resource: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
