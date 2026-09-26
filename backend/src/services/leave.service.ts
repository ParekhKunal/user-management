import { LeaveType } from "../models/leave-type.model.js";
import { Leave } from "../models/leave.model.js";
import { Employee } from "../models/employee.model.js";
import { writeAudit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { toId } from "../utils/ids.js";
import {
  assertLeaveCancellable,
  assertLeaveReviewable,
  businessDaysInclusive,
  rangesOverlap,
} from "../utils/leave-rules.js";
import { assertEmployeeInScope, getScopedEmployeeIds, isUnscopedRole, type Actor } from "../utils/scope.js";
import { badRequest, forbidden, notFound } from "../utils/app-error.js";
import type { CreateLeaveInput, ListLeavesQuery, ReviewLeaveInput } from "../validators/leave.validator.js";

function leaveDTO(row: {
  id: string;
  employeeId: unknown;
  leaveTypeId: unknown;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  reason: string;
  status: string;
  reviewedBy: unknown;
  reviewedAt: Date | null;
  reviewComment: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    startDate: row.startDate,
    endDate: row.endDate,
    numberOfDays: row.numberOfDays,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    reviewComment: row.reviewComment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listLeaveTypes() {
  return LeaveType.find().sort({ name: 1 });
}

export async function createLeave(actor: Actor, input: CreateLeaveInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  if (!actor.employeeId) {
    throw badRequest("An employee profile is required to request leave");
  }

  const leaveType = await LeaveType.findById(input.leaveTypeId);
  if (!leaveType) throw notFound("Leave type not found");

  const employee = await Employee.findById(actor.employeeId);
  if (!employee) throw notFound("Employee not found");

  const days = businessDaysInclusive(input.startDate, input.endDate);
  const existing = await Leave.find({
    employeeId: employee._id,
    status: { $in: ["PENDING", "APPROVED"] },
  });
  if (existing.some((row) => rangesOverlap(input.startDate, input.endDate, row.startDate, row.endDate))) {
    throw badRequest("This leave overlaps an existing request", "LEAVE_OVERLAP");
  }

  const balance = Number(employee.leaveBalances?.[leaveType.code] ?? 0);
  if (leaveType.code !== "UNPAID" && balance < days) {
    throw badRequest("Insufficient leave balance", "INSUFFICIENT_LEAVE");
  }

  const leave = await Leave.create({
    employeeId: employee._id,
    leaveTypeId: leaveType._id,
    startDate: input.startDate,
    endDate: input.endDate,
    numberOfDays: days,
    reason: input.reason,
    status: "PENDING",
  });

  await writeAudit({
    actorId: actor.id,
    action: "LEAVE_CREATED",
    resourceType: "leave",
    resourceId: leave.id,
    req,
  });

  if (employee.managerId) {
    const manager = await Employee.findById(employee.managerId);
    if (manager) {
      await notify({
        recipientId: toId(manager.userId),
        type: "LEAVE_CREATED",
        title: "New leave request",
        message: `${employee.firstName} ${employee.lastName} requested ${days} day(s) of ${leaveType.name}.`,
        metadata: { leaveId: leave.id },
      });
    }
  }

  return leaveDTO(leave);
}

async function scopedFilter(actor: Actor, extra: Record<string, unknown> = {}) {
  const scope = await getScopedEmployeeIds(actor);
  if (scope === "all") return extra;
  return { ...extra, employeeId: { $in: scope } };
}

export async function listMyLeaves(actor: Actor, query: ListLeavesQuery) {
  if (!actor.employeeId) return { leaves: [], pagination: emptyPage(query) };
  return listLeaves(actor, { ...query, employeeId: actor.employeeId }, true);
}

export async function listTeamLeaves(actor: Actor, query: ListLeavesQuery) {
  return listLeaves(actor, query, false);
}

export async function listLeaves(actor: Actor, query: ListLeavesQuery, selfOnly = false) {
  const filter = await scopedFilter(actor, {
    ...(query.status ? { status: query.status } : {}),
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(selfOnly && actor.employeeId ? { employeeId: actor.employeeId } : {}),
  });
  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    Leave.find(filter)
      .populate("leaveTypeId", "code name")
      .populate("employeeId", "firstName lastName employeeCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Leave.countDocuments(filter),
  ]);
  return {
    leaves: rows.map(leaveDTO),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

function emptyPage(query: ListLeavesQuery) {
  return { page: query.page, limit: query.limit, total: 0, totalPages: 1 };
}

export async function getLeave(actor: Actor, id: string) {
  const leave = await Leave.findById(id)
    .populate("leaveTypeId", "code name")
    .populate("employeeId", "firstName lastName employeeCode userId");
  if (!leave) throw notFound("Leave request not found");
  await assertEmployeeInScope(actor, toId(leave.employeeId));
  return leaveDTO(leave);
}

export async function approveLeave(
  actor: Actor,
  id: string,
  input: ReviewLeaveInput,
  req?: Parameters<typeof writeAudit>[0]["req"]
) {
  return reviewLeave(actor, id, "APPROVED", input, req);
}

export async function rejectLeave(
  actor: Actor,
  id: string,
  input: ReviewLeaveInput,
  req?: Parameters<typeof writeAudit>[0]["req"]
) {
  return reviewLeave(actor, id, "REJECTED", input, req);
}

async function reviewLeave(
  actor: Actor,
  id: string,
  status: "APPROVED" | "REJECTED",
  input: ReviewLeaveInput,
  req?: Parameters<typeof writeAudit>[0]["req"]
) {
  const leave = await Leave.findById(id);
  if (!leave) throw notFound("Leave request not found");
  assertLeaveReviewable(leave.status);
  await assertEmployeeInScope(actor, toId(leave.employeeId));

  if (actor.employeeId && toId(leave.employeeId) === actor.employeeId && !isUnscopedRole(actor.role)) {
    throw forbidden("You cannot review your own leave request");
  }

  const updated = await Leave.findOneAndUpdate(
    { _id: leave._id, status: "PENDING" },
    {
      status,
      reviewedBy: actor.id,
      reviewedAt: new Date(),
      reviewComment: input.reviewComment ?? "",
    },
    { new: true }
  );
  if (!updated) {
    throw badRequest("Leave request is no longer pending", "LEAVE_NOT_PENDING");
  }

  const employee = await Employee.findById(leave.employeeId);
  if (employee) {
    if (status === "APPROVED") {
      const leaveType = await LeaveType.findById(leave.leaveTypeId);
      if (leaveType && leaveType.code !== "UNPAID") {
        const current = Number(employee.leaveBalances?.[leaveType.code] ?? 0);
        employee.leaveBalances = {
          ...employee.leaveBalances,
          [leaveType.code]: Math.max(0, current - leave.numberOfDays),
        };
      }
      if (employee.employmentStatus === "ACTIVE") {
        employee.employmentStatus = "ON_LEAVE";
      }
      await employee.save();
    }
    await notify({
      recipientId: toId(employee.userId),
      type: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      title: status === "APPROVED" ? "Leave approved" : "Leave rejected",
      message:
        status === "APPROVED"
          ? "Your leave request was approved."
          : input.reviewComment || "Your leave request was rejected.",
      metadata: { leaveId: leave.id },
    });
  }

  await writeAudit({
    actorId: actor.id,
    action: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
    resourceType: "leave",
    resourceId: leave.id,
    req,
  });

  return leaveDTO(updated);
}

export async function cancelLeave(actor: Actor, id: string) {
  const leave = await Leave.findById(id);
  if (!leave) throw notFound("Leave request not found");
  const isOwner = actor.employeeId === toId(leave.employeeId);
  assertLeaveCancellable(leave.status, isOwner);
  leave.status = "CANCELLED";
  await leave.save();
  return leaveDTO(leave);
}
