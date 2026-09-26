import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import { Leave } from "../models/leave.model.js";
import { Team } from "../models/team.model.js";
import { User } from "../models/user.model.js";
import { AuditLog } from "../models/audit-log.model.js";
import { EmployeeHistory } from "../models/employee-history.model.js";
import { Notification } from "../models/notification.model.js";
import { getTodayAttendance } from "./attendance.service.js";
import { getScopedEmployeeIds, isUnscopedRole, type Actor } from "../utils/scope.js";
import * as userService from "./user.service.js";

export async function getSummary(actor: Actor) {
  const [userStats, employee] = await Promise.all([
    isUnscopedRole(actor.role) || actor.role === "admin" ? userService.getDashboardStats() : null,
    actor.employeeId ? Employee.findById(actor.employeeId).populate("departmentId", "name").populate("managerId", "firstName lastName") : null,
  ]);

  const scope = await getScopedEmployeeIds(actor);
  const employeeFilter: Record<string, unknown> =
    scope === "all" ? { deletedAt: null } : { deletedAt: null, _id: { $in: scope } };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalEmployees,
    activeEmployees,
    onboarding,
    onLeave,
    departments,
    teams,
    pendingLeave,
    newEmployees,
    today,
    unread,
    pendingApprovals,
  ] = await Promise.all([
    Employee.countDocuments(employeeFilter),
    Employee.countDocuments({ ...employeeFilter, employmentStatus: "ACTIVE" }),
    Employee.countDocuments({ ...employeeFilter, employmentStatus: "ONBOARDING" }),
    Employee.countDocuments({ ...employeeFilter, employmentStatus: "ON_LEAVE" }),
    Department.countDocuments({ status: "ACTIVE" }),
    Team.countDocuments({ status: "ACTIVE" }),
    Leave.countDocuments({
      status: "PENDING",
      ...(scope === "all" ? {} : { employeeId: { $in: scope } }),
    }),
    Employee.countDocuments({ ...employeeFilter, createdAt: { $gte: weekAgo } }),
    getTodayAttendance(actor.employeeId),
    Notification.countDocuments({ recipientId: actor.id, readAt: null }),
    User.countDocuments({ deletedAt: null, status: "pending" }),
  ]);

  return {
    role: actor.role,
    users: userStats,
    totalEmployees,
    activeEmployees,
    pendingOnboarding: onboarding,
    employeesOnLeave: onLeave,
    departments,
    teams,
    pendingLeaveRequests: pendingLeave,
    newEmployees,
    pendingApprovals,
    todayAttendance: today,
    unreadNotifications: unread,
    leaveBalances: employee?.leaveBalances ?? {},
    myProfile: employee
      ? {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`.trim(),
          employeeCode: employee.employeeCode,
          jobTitle: employee.jobTitle,
          department: employee.departmentId,
          manager: employee.managerId,
          employmentStatus: employee.employmentStatus,
        }
      : null,
    teamSize: scope === "all" ? totalEmployees : Math.max(0, (scope as string[]).length - (actor.employeeId ? 1 : 0)),
  };
}

export async function getRecentActivity(actor: Actor) {
  if (actor.role === "super-admin" || actor.role === "admin") {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(12).populate("actorId", "name email");
    return { source: "audit", items: logs };
  }

  const scope = await getScopedEmployeeIds(actor);
  const filter = scope === "all" ? {} : { employeeId: { $in: scope } };
  const history = await EmployeeHistory.find(filter).sort({ createdAt: -1 }).limit(12);
  return { source: "history", items: history };
}

export async function getTeamSummary(actor: Actor) {
  const scope = await getScopedEmployeeIds(actor);
  const ids = scope === "all" ? null : scope;
  const filter = ids ? { deletedAt: null, _id: { $in: ids } } : { deletedAt: null };
  const [members, onLeave, pendingLeave] = await Promise.all([
    Employee.find(filter)
      .populate("departmentId", "name")
      .populate("teamId", "name")
      .sort({ firstName: 1 })
      .limit(50),
    Employee.countDocuments({ ...filter, employmentStatus: "ON_LEAVE" }),
    Leave.countDocuments({
      status: "PENDING",
      ...(ids ? { employeeId: { $in: ids } } : {}),
    }),
  ]);

  return {
    teamSize: members.length,
    employeesOnLeave: onLeave,
    pendingLeaveRequests: pendingLeave,
    members: members.map((row) => ({
      id: row.id,
      name: `${row.firstName} ${row.lastName}`.trim(),
      employeeCode: row.employeeCode,
      jobTitle: row.jobTitle,
      employmentStatus: row.employmentStatus,
      department: row.departmentId,
      team: row.teamId,
    })),
  };
}
