import { AuditLog } from "../models/audit-log.model.js";
import { escapeRegex } from "../utils/ids.js";
import type { ListAuditQuery } from "../validators/audit.validator.js";

export async function listAuditLogs(query: ListAuditQuery) {
  const filter: Record<string, unknown> = {};
  if (query.actor) filter.actorId = query.actor;
  if (query.action) filter.action = query.action;
  if (query.resource) {
    filter.$or = [
      { resourceType: { $regex: escapeRegex(query.resource), $options: "i" } },
      { action: { $regex: escapeRegex(query.resource), $options: "i" } },
    ];
  }
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    AuditLog.find(filter).populate("actorId", "name email role").sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs: rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      before: row.before,
      after: row.after,
      metadata: row.metadata,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
