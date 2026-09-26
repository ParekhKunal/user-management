import { Attendance } from "../models/attendance.model.js";
import { Employee } from "../models/employee.model.js";
import { writeAudit } from "../utils/audit.js";
import {
  assertClockInAllowed,
  assertClockOutAllowed,
  assertNotFuture,
  attendanceStatusFromMinutes,
  minutesBetween,
  startOfUtcDay,
} from "../utils/attendance-rules.js";
import { assertEmployeeInScope, getScopedEmployeeIds, type Actor } from "../utils/scope.js";
import { badRequest, notFound } from "../utils/app-error.js";
import { toId } from "../utils/ids.js";
import type { ListAttendanceQuery } from "../validators/attendance.validator.js";

function attendanceDTO(row: {
  id: string;
  employeeId: unknown;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  totalMinutes: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    date: row.date,
    clockIn: row.clockIn,
    clockOut: row.clockOut,
    totalMinutes: row.totalMinutes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function clockIn(actor: Actor, req?: Parameters<typeof writeAudit>[0]["req"]) {
  if (!actor.employeeId) {
    throw badRequest("An employee profile is required to clock in");
  }
  const now = new Date();
  assertNotFuture(now);
  const day = startOfUtcDay(now);
  const existing = await Attendance.findOne({ employeeId: actor.employeeId, date: day });
  assertClockInAllowed(existing);

  const record = await Attendance.findOneAndUpdate(
    { employeeId: actor.employeeId, date: day, clockIn: null },
    { $setOnInsert: { employeeId: actor.employeeId, date: day }, $set: { clockIn: now, status: "PRESENT" } },
    { new: true, upsert: true }
  );

  await writeAudit({
    actorId: actor.id,
    action: "ATTENDANCE_CLOCK_IN",
    resourceType: "attendance",
    resourceId: record.id,
    req,
  });
  return attendanceDTO(record);
}

export async function clockOut(actor: Actor, req?: Parameters<typeof writeAudit>[0]["req"]) {
  if (!actor.employeeId) {
    throw badRequest("An employee profile is required to clock out");
  }
  const now = new Date();
  assertNotFuture(now);
  const day = startOfUtcDay(now);
  const existing = await Attendance.findOne({ employeeId: actor.employeeId, date: day });
  assertClockOutAllowed(existing);

  const clockIn = existing!.clockIn!;
  const totalMinutes = minutesBetween(clockIn, now);
  const updated = await Attendance.findOneAndUpdate(
    { _id: existing!._id, clockOut: null },
    { clockOut: now, totalMinutes, status: attendanceStatusFromMinutes(totalMinutes) },
    { new: true }
  );
  if (!updated) {
    throw badRequest("Already clocked out for this day", "DUPLICATE_CLOCK_OUT");
  }

  await writeAudit({
    actorId: actor.id,
    action: "ATTENDANCE_CLOCK_OUT",
    resourceType: "attendance",
    resourceId: updated.id,
    req,
  });
  return attendanceDTO(updated);
}

export async function listMyAttendance(actor: Actor, query: ListAttendanceQuery) {
  if (!actor.employeeId) {
    return { attendance: [], pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 1 } };
  }
  return listAttendance(actor, { ...query, employeeId: actor.employeeId });
}

export async function listTeamAttendance(actor: Actor, query: ListAttendanceQuery) {
  return listAttendance(actor, query);
}

export async function listEmployeeAttendance(actor: Actor, employeeId: string, query: ListAttendanceQuery) {
  await assertEmployeeInScope(actor, employeeId);
  const employee = await Employee.findOne({ _id: employeeId, deletedAt: null });
  if (!employee) throw notFound("Employee not found");
  return listAttendance(actor, { ...query, employeeId });
}

export async function listAttendance(actor: Actor, query: ListAttendanceQuery) {
  const filter: Record<string, unknown> = {};
  const scope = await getScopedEmployeeIds(actor);
  if (query.employeeId) {
    if (scope !== "all" && !scope.includes(query.employeeId)) {
      throw notFound("Employee not found");
    }
    filter.employeeId = query.employeeId;
  } else if (scope !== "all") {
    filter.employeeId = { $in: scope };
  }
  if (query.from || query.to) {
    filter.date = {
      ...(query.from ? { $gte: startOfUtcDay(query.from) } : {}),
      ...(query.to ? { $lte: startOfUtcDay(query.to) } : {}),
    };
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    Attendance.find(filter)
      .populate("employeeId", "firstName lastName employeeCode")
      .sort({ date: -1 })
      .skip(skip)
      .limit(query.limit),
    Attendance.countDocuments(filter),
  ]);

  return {
    attendance: rows.map(attendanceDTO),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTodayAttendance(employeeId: string | null) {
  if (!employeeId) return null;
  const day = startOfUtcDay(new Date());
  const row = await Attendance.findOne({ employeeId, date: day });
  return row ? attendanceDTO(row) : null;
}

export function employeeUserId(employee: { userId: unknown }): string {
  return toId(employee.userId);
}
