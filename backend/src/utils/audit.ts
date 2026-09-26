import type { Request } from "express";
import { AuditLog } from "../models/audit-log.model.js";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  await AuditLog.create({
    actorId: input.actorId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    metadata: input.metadata ?? {},
    ipAddress: input.req?.ip ?? "",
    userAgent: input.req?.get("user-agent") ?? "",
  });
}

export async function writeHistory(input: {
  employeeId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  performedBy?: string | null;
  reason?: string;
}): Promise<void> {
  const { EmployeeHistory } = await import("../models/employee-history.model.js");
  await EmployeeHistory.create({
    employeeId: input.employeeId,
    action: input.action,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    performedBy: input.performedBy ?? null,
    reason: input.reason ?? "",
  });
}
