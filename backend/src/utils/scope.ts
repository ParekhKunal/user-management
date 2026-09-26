import type { Permission } from "../constants/permissions.js";
import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import { Team } from "../models/team.model.js";
import type { UserRole } from "../models/user.model.js";

export interface Actor {
  id: string;
  role: UserRole;
  permissions: Permission[];
  employeeId: string | null;
}

export function isUnscopedRole(role: UserRole): boolean {
  return role === "super-admin" || role === "admin" || role === "hr-manager";
}

export function canSeeSensitiveEmployee(actor: Actor, employeeUserId: string): boolean {
  if (isUnscopedRole(actor.role)) {
    return true;
  }
  return actor.id === employeeUserId;
}

export async function getScopedEmployeeIds(actor: Actor): Promise<string[] | "all"> {
  if (isUnscopedRole(actor.role)) {
    return "all";
  }

  if (!actor.employeeId) {
    return [];
  }

  if (actor.role === "employee" || actor.role === "user") {
    return [actor.employeeId];
  }

  const ids = new Set<string>([actor.employeeId]);

  const reports = await Employee.find({
    managerId: actor.employeeId,
    deletedAt: null,
  }).select("_id");
  reports.forEach((row) => ids.add(String(row._id)));

  const managedTeams = await Team.find({ managerId: actor.employeeId, status: "ACTIVE" }).select("_id");
  if (managedTeams.length > 0) {
    const teamMembers = await Employee.find({
      teamId: { $in: managedTeams.map((team) => team._id) },
      deletedAt: null,
    }).select("_id");
    teamMembers.forEach((row) => ids.add(String(row._id)));
  }

  const managedDepartments = await Department.find({
    managerId: actor.employeeId,
    status: "ACTIVE",
  }).select("_id");
  if (managedDepartments.length > 0) {
    const deptMembers = await Employee.find({
      departmentId: { $in: managedDepartments.map((dept) => dept._id) },
      deletedAt: null,
    }).select("_id");
    deptMembers.forEach((row) => ids.add(String(row._id)));
  }

  return [...ids];
}

export async function assertEmployeeInScope(actor: Actor, employeeId: string): Promise<void> {
  const scope = await getScopedEmployeeIds(actor);
  if (scope === "all") {
    return;
  }
  if (!scope.includes(employeeId)) {
    const { forbidden } = await import("./app-error.js");
    throw forbidden("This employee is outside your authorized scope");
  }
}
