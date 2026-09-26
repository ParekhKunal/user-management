import type { EmployeeDocument } from "../models/employee.model.js";
import type { Actor } from "./scope.js";
import { canSeeSensitiveEmployee } from "./scope.js";
import { toId } from "./ids.js";

function nameOf(employee: EmployeeDocument): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function refName(value: unknown): { id: string; name: string } | null {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value !== null && "name" in value) {
    const row = value as { _id?: unknown; id?: unknown; name?: string; firstName?: string; lastName?: string };
    const display =
      row.name ??
      `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
    return { id: toId(row._id ?? row.id), name: display };
  }
  return { id: toId(value), name: "" };
}

export function employeeListDTO(employee: EmployeeDocument) {
  return {
    id: employee.id,
    userId: toId(employee.userId),
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    name: nameOf(employee),
    email: employee.email,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    workMode: employee.workMode,
    location: employee.location,
    joiningDate: employee.joiningDate,
    department: refName(employee.departmentId),
    team: refName(employee.teamId),
    manager: refName(employee.managerId),
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

export function employeeDetailsDTO(employee: EmployeeDocument, actor: Actor) {
  const base = employeeListDTO(employee);
  const ownerUserId = toId(
    typeof employee.userId === "object" && employee.userId && "_id" in employee.userId
      ? (employee.userId as { _id: unknown })._id
      : employee.userId
  );
  const sensitive = canSeeSensitiveEmployee(actor, ownerUserId);

  return {
    ...base,
    profileImage: employee.profileImage,
    dateOfBirth: sensitive ? employee.dateOfBirth : null,
    gender: employee.gender,
    address: sensitive ? employee.address : null,
    emergencyContact: sensitive ? employee.emergencyContact : null,
    leaveBalances: sensitive || isUnscoped(actor) ? employee.leaveBalances : undefined,
    deletedAt: employee.deletedAt,
  };
}

function isUnscoped(actor: Actor): boolean {
  return actor.role === "super-admin" || actor.role === "admin" || actor.role === "hr-manager";
}

export function employeeSelfDTO(employee: EmployeeDocument) {
  return {
    ...employeeListDTO(employee),
    profileImage: employee.profileImage,
    dateOfBirth: employee.dateOfBirth,
    gender: employee.gender,
    address: employee.address,
    emergencyContact: employee.emergencyContact,
    leaveBalances: employee.leaveBalances,
  };
}
