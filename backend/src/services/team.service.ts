import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import { Team } from "../models/team.model.js";
import { writeAudit } from "../utils/audit.js";
import { employeeListDTO } from "../utils/employee-dto.js";
import { escapeRegex } from "../utils/ids.js";
import { badRequest, conflict, notFound } from "../utils/app-error.js";
import type { Actor } from "../utils/scope.js";
import type { CreateTeamInput, UpdateTeamInput } from "../validators/organization.validator.js";

function publicTeam(row: {
  id: string;
  name: string;
  code: string;
  departmentId: unknown;
  managerId: unknown;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    departmentId: row.departmentId,
    managerId: row.managerId,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listTeams(query: {
  search?: string;
  status?: string;
  departmentId?: string;
  page: number;
  limit: number;
}) {
  const filter: Record<string, unknown> = {};
  if (query.search) {
    const escaped = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { code: { $regex: escaped, $options: "i" } },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.departmentId) filter.departmentId = query.departmentId;
  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    Team.find(filter).populate("departmentId", "name code").sort({ name: 1 }).skip(skip).limit(query.limit),
    Team.countDocuments(filter),
  ]);
  return {
    teams: rows.map(publicTeam),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function createTeam(actor: Actor, input: CreateTeamInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const department = await Department.findById(input.departmentId);
  if (!department) throw notFound("Department not found");
  if (department.status !== "ACTIVE") {
    throw badRequest("Team cannot be assigned to an inactive department", "DEPARTMENT_INACTIVE");
  }
  const code = input.code.toUpperCase();
  const existing = await Team.findOne({ departmentId: input.departmentId, code });
  if (existing) throw conflict("Team code already exists in this department", "TEAM_CODE_EXISTS");
  const team = await Team.create({ ...input, code });
  await writeAudit({
    actorId: actor.id,
    action: "TEAM_CREATED",
    resourceType: "team",
    resourceId: team.id,
    after: { name: team.name, code },
    req,
  });
  return publicTeam(team);
}

export async function getTeam(id: string) {
  const team = await Team.findById(id).populate("departmentId", "name code");
  if (!team) throw notFound("Team not found");
  return publicTeam(team);
}

export async function updateTeam(actor: Actor, id: string, input: UpdateTeamInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const team = await Team.findById(id);
  if (!team) throw notFound("Team not found");
  if (input.departmentId) {
    const department = await Department.findById(input.departmentId);
    if (!department) throw notFound("Department not found");
    if (department.status !== "ACTIVE") {
      throw badRequest("Team cannot be assigned to an inactive department", "DEPARTMENT_INACTIVE");
    }
    team.departmentId = department._id;
  }
  if (input.code) {
    const code = input.code.toUpperCase();
    const existing = await Team.findOne({
      departmentId: team.departmentId,
      code,
      _id: { $ne: id },
    });
    if (existing) throw conflict("Team code already exists in this department", "TEAM_CODE_EXISTS");
    team.code = code;
  }
  if (input.name) team.name = input.name;
  if (input.description !== undefined) team.description = input.description;
  if (input.managerId !== undefined) team.managerId = input.managerId as never;
  if (input.status) team.status = input.status;
  await team.save();
  await writeAudit({
    actorId: actor.id,
    action: "TEAM_UPDATED",
    resourceType: "team",
    resourceId: team.id,
    after: input as Record<string, unknown>,
    req,
  });
  return publicTeam(team);
}

export async function deleteTeam(actor: Actor, id: string, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const activeEmployees = await Employee.countDocuments({ teamId: id, deletedAt: null });
  if (activeEmployees > 0) {
    throw badRequest("Reassign employees before deleting this team", "TEAM_HAS_EMPLOYEES");
  }
  const team = await Team.findByIdAndDelete(id);
  if (!team) throw notFound("Team not found");
  await writeAudit({ actorId: actor.id, action: "TEAM_DELETED", resourceType: "team", resourceId: id, req });
}

export async function listTeamEmployees(id: string) {
  await getTeam(id);
  const rows = await Employee.find({ teamId: id, deletedAt: null })
    .populate([
      { path: "departmentId", select: "name code" },
      { path: "managerId", select: "firstName lastName" },
    ])
    .sort({ firstName: 1 });
  return rows.map(employeeListDTO);
}
