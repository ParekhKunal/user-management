import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import { Team } from "../models/team.model.js";
import { writeAudit } from "../utils/audit.js";
import { employeeListDTO } from "../utils/employee-dto.js";
import { escapeRegex } from "../utils/ids.js";
import { badRequest, conflict, notFound } from "../utils/app-error.js";
import type { Actor } from "../utils/scope.js";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "../validators/organization.validator.js";

function publicDepartment(row: { id: string; name: string; code: string; description: string; managerId: unknown; status: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    managerId: row.managerId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listDepartments(query: { search?: string; status?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (query.search) {
    const escaped = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { code: { $regex: escaped, $options: "i" } },
    ];
  }
  if (query.status) filter.status = query.status;
  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    Department.find(filter).sort({ name: 1 }).skip(skip).limit(query.limit),
    Department.countDocuments(filter),
  ]);
  return {
    departments: rows.map(publicDepartment),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function createDepartment(actor: Actor, input: CreateDepartmentInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const code = input.code.toUpperCase();
  const existing = await Department.findOne({ code });
  if (existing) {
    throw conflict("Department code already exists", "DEPARTMENT_CODE_EXISTS");
  }
  const department = await Department.create({ ...input, code });
  await writeAudit({ actorId: actor.id, action: "DEPARTMENT_CREATED", resourceType: "department", resourceId: department.id, after: { name: department.name, code }, req });
  return publicDepartment(department);
}

export async function getDepartment(id: string) {
  const department = await Department.findById(id);
  if (!department) throw notFound("Department not found");
  return publicDepartment(department);
}

export async function updateDepartment(actor: Actor, id: string, input: UpdateDepartmentInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const department = await Department.findById(id);
  if (!department) throw notFound("Department not found");
  if (input.code) {
    const code = input.code.toUpperCase();
    const existing = await Department.findOne({ code, _id: { $ne: id } });
    if (existing) throw conflict("Department code already exists", "DEPARTMENT_CODE_EXISTS");
    department.code = code;
  }
  if (input.name) department.name = input.name;
  if (input.description !== undefined) department.description = input.description;
  if (input.managerId !== undefined) department.managerId = input.managerId as never;
  if (input.status) department.status = input.status;
  await department.save();
  await writeAudit({ actorId: actor.id, action: "DEPARTMENT_UPDATED", resourceType: "department", resourceId: department.id, after: input as Record<string, unknown>, req });
  return publicDepartment(department);
}

export async function deleteDepartment(actor: Actor, id: string, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const activeEmployees = await Employee.countDocuments({ departmentId: id, deletedAt: null });
  if (activeEmployees > 0) {
    throw badRequest("Reassign employees before deleting this department", "DEPARTMENT_HAS_EMPLOYEES");
  }
  const activeTeams = await Team.countDocuments({ departmentId: id });
  if (activeTeams > 0) {
    throw badRequest("Remove or reassign teams before deleting this department", "DEPARTMENT_HAS_TEAMS");
  }
  const department = await Department.findByIdAndDelete(id);
  if (!department) throw notFound("Department not found");
  await writeAudit({ actorId: actor.id, action: "DEPARTMENT_DELETED", resourceType: "department", resourceId: id, req });
}

export async function listDepartmentEmployees(id: string) {
  await getDepartment(id);
  const rows = await Employee.find({ departmentId: id, deletedAt: null })
    .populate([
      { path: "teamId", select: "name code" },
      { path: "managerId", select: "firstName lastName" },
    ])
    .sort({ firstName: 1 });
  return rows.map(employeeListDTO);
}
