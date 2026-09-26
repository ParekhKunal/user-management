import mongoose from "mongoose";
import { DEFAULT_LEAVE_BALANCES, canTransitionEmployment } from "../constants/employment.js";
import { Department } from "../models/department.model.js";
import { Employee, type EmployeeDocument } from "../models/employee.model.js";
import { Invitation } from "../models/invitation.model.js";
import { Team } from "../models/team.model.js";
import { User } from "../models/user.model.js";
import { formatEmployeeCode, nextSequence } from "../models/counter.model.js";
import { writeAudit, writeHistory } from "../utils/audit.js";
import { employeeDetailsDTO, employeeListDTO, employeeSelfDTO } from "../utils/employee-dto.js";
import { hashPassword } from "../utils/password.js";
import { hashToken, randomToken, escapeRegex, toId } from "../utils/ids.js";
import { notify } from "../utils/notify.js";
import { assertEmployeeInScope, getScopedEmployeeIds, type Actor } from "../utils/scope.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/app-error.js";
import type {
  AcceptInvitationInput,
  BulkUpdateInput,
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "../validators/employee.validator.js";

const POPULATE = [
  { path: "departmentId", select: "name code" },
  { path: "teamId", select: "name code" },
  { path: "managerId", select: "firstName lastName employeeCode" },
];

function displayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

async function findEmployee(id: string, includeDeleted = false): Promise<EmployeeDocument> {
  const filter: Record<string, unknown> = { _id: id };
  if (!includeDeleted) {
    filter.deletedAt = null;
  }
  const employee = await Employee.findOne(filter).populate(POPULATE);
  if (!employee) {
    throw notFound("Employee not found", "EMPLOYEE_NOT_FOUND");
  }
  return employee;
}

async function assertOrgLinks(input: {
  departmentId?: string | null;
  teamId?: string | null;
  managerId?: string | null;
  selfId?: string;
}): Promise<void> {
  let department = null;
  if (input.departmentId) {
    department = await Department.findById(input.departmentId);
    if (!department) {
      throw badRequest("Department not found", "DEPARTMENT_NOT_FOUND");
    }
  }

  if (input.teamId) {
    const team = await Team.findById(input.teamId);
    if (!team) {
      throw badRequest("Team not found", "TEAM_NOT_FOUND");
    }
    if (team.status !== "ACTIVE") {
      throw badRequest("Cannot assign an inactive team", "TEAM_INACTIVE");
    }
    const departmentId = input.departmentId ?? (department ? String(department._id) : null);
    if (departmentId && String(team.departmentId) !== departmentId) {
      throw badRequest("Employee cannot belong to a team from another department", "TEAM_DEPARTMENT_MISMATCH");
    }
    const parent = await Department.findById(team.departmentId);
    if (parent && parent.status !== "ACTIVE") {
      throw badRequest("Team cannot be assigned to an inactive department", "DEPARTMENT_INACTIVE");
    }
  }

  if (input.managerId) {
    if (input.selfId && input.managerId === input.selfId) {
      throw badRequest("An employee cannot report to themselves", "INVALID_MANAGER");
    }
    const manager = await Employee.findOne({ _id: input.managerId, deletedAt: null });
    if (!manager) {
      throw badRequest("Manager not found", "MANAGER_NOT_FOUND");
    }
  }
}

export async function createEmployee(actor: Actor, input: CreateEmployeeInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const email = input.email.toLowerCase();
  const existingUser = await User.findOne({ email, deletedAt: null });
  if (existingUser) {
    throw conflict("Email already exists", "EMAIL_EXISTS");
  }
  const existingEmployee = await Employee.findOne({ email, deletedAt: null });
  if (existingEmployee) {
    throw conflict("Email already exists", "EMAIL_EXISTS");
  }

  if (actor.role === "admin" && input.role === "admin") {
    // allowed
  }
  if (actor.role !== "super-admin" && input.role === "admin") {
    throw forbidden("Only Super Admin can create administrators");
  }

  await assertOrgLinks(input);

  const invite = input.invite !== false && !input.password;
  const password = input.password ?? randomToken(12);
  const seq = await nextSequence("employeeCode");
  const employeeCode = formatEmployeeCode(seq);

  const user = await User.create({
    name: displayName(input.firstName, input.lastName),
    email,
    passwordHash: await hashPassword(password),
    role: input.role ?? "employee",
    status: invite ? "pending" : "active",
    approvedBy: invite ? null : actor.id,
    approvedAt: invite ? null : new Date(),
  });

  const employee = await Employee.create({
    userId: user._id,
    employeeCode,
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    phone: input.phone ?? "",
    dateOfBirth: input.dateOfBirth ?? null,
    gender: input.gender ?? "UNSPECIFIED",
    joiningDate: input.joiningDate ?? new Date(),
    employmentType: input.employmentType ?? "FULL_TIME",
    employmentStatus: invite ? "ONBOARDING" : "ACTIVE",
    jobTitle: input.jobTitle ?? "",
    departmentId: input.departmentId ?? null,
    teamId: input.teamId ?? null,
    managerId: input.managerId ?? null,
    location: input.location ?? "",
    workMode: input.workMode ?? "HYBRID",
    address: input.address,
    emergencyContact: input.emergencyContact,
    leaveBalances: { ...DEFAULT_LEAVE_BALANCES },
  });

  let invitationToken: string | undefined;
  if (invite) {
    invitationToken = randomToken(32);
    await Invitation.create({
      employeeId: employee._id,
      userId: user._id,
      email,
      tokenHash: hashToken(invitationToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      invitedBy: actor.id,
    });
    await notify({
      recipientId: user.id,
      type: "INVITATION_CREATED",
      title: "You have been invited",
      message: "Complete onboarding using your invitation link.",
      metadata: { employeeId: employee.id },
    });
  }

  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_CREATED",
    resourceType: "employee",
    resourceId: employee.id,
    after: { email, employeeCode },
    req,
  });

  const populated = await findEmployee(employee.id);
  return {
    employee: employeeDetailsDTO(populated, actor),
    invitationToken,
    invitationExpiresInHours: invite ? 24 : undefined,
  };
}

function sortSpec(query: ListEmployeesQuery): Record<string, 1 | -1> {
  const dir = query.order === "asc" ? 1 : -1;
  switch (query.sort) {
    case "name":
      return { firstName: dir, lastName: dir };
    case "joiningDate":
      return { joiningDate: dir };
    case "employeeCode":
      return { employeeCode: dir };
    case "department":
      return { departmentId: dir };
    default:
      return { createdAt: dir };
  }
}

export async function listEmployees(actor: Actor, query: ListEmployeesQuery, deletedOnly = false) {
  const filter: Record<string, unknown> = deletedOnly ? { deletedAt: { $ne: null } } : { deletedAt: null };
  const scope = await getScopedEmployeeIds(actor);
  if (scope !== "all") {
    filter._id = { $in: scope };
  }

  if (query.search) {
    const escaped = escapeRegex(query.search);
    filter.$or = [
      { firstName: { $regex: escaped, $options: "i" } },
      { lastName: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { employeeCode: { $regex: escaped, $options: "i" } },
      { jobTitle: { $regex: escaped, $options: "i" } },
    ];
  }
  if (query.department) filter.departmentId = query.department;
  if (query.team) filter.teamId = query.team;
  if (query.manager) filter.managerId = query.manager;
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.employmentStatus) filter.employmentStatus = query.employmentStatus;
  if (query.workMode) filter.workMode = query.workMode;
  if (query.location) filter.location = { $regex: escapeRegex(query.location), $options: "i" };
  if (query.joiningFrom || query.joiningTo) {
    filter.joiningDate = {
      ...(query.joiningFrom ? { $gte: query.joiningFrom } : {}),
      ...(query.joiningTo ? { $lte: query.joiningTo } : {}),
    };
  }

  if (query.accountStatus) {
    const users = await User.find({ status: query.accountStatus, deletedAt: null }).select("_id");
    const userIds = users.map((user) => user._id);
    filter.userId = filter.userId ? { $in: userIds } : { $in: userIds };
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    Employee.find(filter).populate(POPULATE).sort(sortSpec(query)).skip(skip).limit(query.limit),
    Employee.countDocuments(filter),
  ]);

  return {
    employees: rows.map(employeeListDTO),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getEmployee(actor: Actor, id: string) {
  const employee = await findEmployee(id);
  await assertEmployeeInScope(actor, employee.id);
  return employeeDetailsDTO(employee, actor);
}

export async function getMyEmployee(actor: Actor) {
  if (!actor.employeeId) {
    throw notFound("No employee profile is linked to this account");
  }
  const employee = await findEmployee(actor.employeeId);
  return employeeSelfDTO(employee);
}

const SELF_EDITABLE = new Set(["phone", "profileImage", "address", "emergencyContact"]);
const HR_EDITABLE = new Set([
  "jobTitle",
  "departmentId",
  "teamId",
  "managerId",
  "employmentType",
  "joiningDate",
  "workMode",
  "location",
  "firstName",
  "lastName",
  "phone",
  "profileImage",
  "dateOfBirth",
  "gender",
  "address",
  "emergencyContact",
]);

export async function updateEmployee(actor: Actor, id: string, input: UpdateEmployeeInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const employee = await findEmployee(id);
  await assertEmployeeInScope(actor, employee.id);

  const isSelf = actor.employeeId === employee.id;
  const isHr = actor.role === "super-admin" || actor.role === "admin" || actor.role === "hr-manager";

  const updates = { ...input };
  delete (updates as { reason?: string }).reason;

  if (!isHr) {
    if (!isSelf) {
      throw forbidden("You can only update your own profile");
    }
    for (const key of Object.keys(updates)) {
      if (!SELF_EDITABLE.has(key)) {
        throw forbidden(`Employees cannot update ${key}`);
      }
    }
  } else {
    for (const key of Object.keys(updates)) {
      if (!HR_EDITABLE.has(key)) {
        throw forbidden(`Field ${key} cannot be updated`);
      }
    }
  }

  await assertOrgLinks({
    departmentId: updates.departmentId === undefined ? toId(employee.departmentId) || null : updates.departmentId,
    teamId: updates.teamId === undefined ? toId(employee.teamId) || null : updates.teamId,
    managerId: updates.managerId === undefined ? toId(employee.managerId) || null : updates.managerId,
    selfId: employee.id,
  });

  const tracked: Array<[string, unknown, unknown]> = [];
  const map: Array<[string, string]> = [
    ["departmentId", "DEPARTMENT_CHANGED"],
    ["teamId", "TEAM_CHANGED"],
    ["managerId", "MANAGER_CHANGED"],
    ["jobTitle", "TITLE_CHANGED"],
    ["workMode", "WORK_MODE_CHANGED"],
    ["employmentType", "EMPLOYMENT_TYPE_CHANGED"],
  ];

  for (const [field, action] of map) {
    const next = updates[field as keyof typeof updates];
    if (next !== undefined) {
      const previous = employee.get(field);
      if (String(previous ?? "") !== String(next ?? "")) {
        tracked.push([action, previous, next]);
      }
    }
  }

  Object.assign(employee, updates);
  await employee.save();

  if (updates.firstName || updates.lastName) {
    await User.updateOne(
      { _id: employee.userId },
      { name: displayName(employee.firstName, employee.lastName) }
    );
  }

  for (const [action, oldValue, newValue] of tracked) {
    await writeHistory({
      employeeId: employee.id,
      action,
      oldValue,
      newValue,
      performedBy: actor.id,
      reason: input.reason,
    });
  }

  if (tracked.some(([action]) => action === "TEAM_CHANGED") && employee.userId) {
    await notify({
      recipientId: toId(employee.userId),
      type: "TEAM_CHANGED",
      title: "Team updated",
      message: "Your team assignment has changed.",
    });
  }
  if (tracked.some(([action]) => action === "MANAGER_CHANGED") && employee.userId) {
    await notify({
      recipientId: toId(employee.userId),
      type: "MANAGER_CHANGED",
      title: "Manager updated",
      message: "Your reporting manager has changed.",
    });
  }

  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_UPDATED",
    resourceType: "employee",
    resourceId: employee.id,
    after: updates as Record<string, unknown>,
    req,
  });

  if (isSelf) {
    await notify({
      recipientId: actor.id,
      type: "PROFILE_UPDATED",
      title: "Profile updated",
      message: "Your employee profile was updated.",
    });
  }

  const populated = await findEmployee(employee.id);
  return employeeDetailsDTO(populated, actor);
}

export async function updateEmployeeStatus(
  actor: Actor,
  id: string,
  input: UpdateEmployeeStatusInput,
  req?: Parameters<typeof writeAudit>[0]["req"]
) {
  const employee = await findEmployee(id);
  if (!canTransitionEmployment(employee.employmentStatus, input.employmentStatus)) {
    throw badRequest(
      `Cannot change employment status from ${employee.employmentStatus} to ${input.employmentStatus}`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const previous = employee.employmentStatus;
  employee.employmentStatus = input.employmentStatus;
  await employee.save();

  if (input.employmentStatus === "TERMINATED" || input.employmentStatus === "RESIGNED" || input.employmentStatus === "RETIRED") {
    await User.updateOne({ _id: employee.userId }, { status: "inactive" });
  }

  await writeHistory({
    employeeId: employee.id,
    action: "STATUS_CHANGED",
    oldValue: previous,
    newValue: input.employmentStatus,
    performedBy: actor.id,
    reason: input.reason,
  });
  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_UPDATED",
    resourceType: "employee",
    resourceId: employee.id,
    before: { employmentStatus: previous },
    after: { employmentStatus: input.employmentStatus },
    req,
  });

  const populated = await findEmployee(employee.id);
  return employeeDetailsDTO(populated, actor);
}

export async function softDeleteEmployee(actor: Actor, id: string, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const employee = await findEmployee(id);
  employee.deletedAt = new Date();
  employee.deletedBy = new mongoose.Types.ObjectId(actor.id);
  await employee.save();
  await User.updateOne({ _id: employee.userId }, { status: "inactive", deletedAt: new Date() });
  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_DELETED",
    resourceType: "employee",
    resourceId: employee.id,
    req,
  });
}

export async function restoreEmployee(actor: Actor, id: string, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const employee = await findEmployee(id, true);
  if (!employee.deletedAt) {
    throw badRequest("Employee is not deleted", "NOT_DELETED");
  }
  employee.deletedAt = null;
  employee.deletedBy = null;
  await employee.save();
  await User.updateOne({ _id: employee.userId }, { status: "active", deletedAt: null });
  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_RESTORED",
    resourceType: "employee",
    resourceId: employee.id,
    req,
  });
  const populated = await findEmployee(employee.id);
  return employeeDetailsDTO(populated, actor);
}

export async function setAccountActive(actor: Actor, id: string, active: boolean, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const employee = await findEmployee(id);
  await User.updateOne({ _id: employee.userId, deletedAt: null }, { status: active ? "active" : "inactive" });
  await writeAudit({
    actorId: actor.id,
    action: active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
    resourceType: "employee",
    resourceId: employee.id,
    req,
  });
  const populated = await findEmployee(employee.id);
  return employeeDetailsDTO(populated, actor);
}

export async function bulkUpdate(actor: Actor, input: BulkUpdateInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const results: Array<{ id: string; ok: boolean; message?: string }> = [];

  for (const employeeId of input.employeeIds) {
    try {
      await assertEmployeeInScope(actor, employeeId);
      const employee = await findEmployee(employeeId);
      if (input.operation === "ASSIGN_DEPARTMENT") {
        if (!input.value) throw badRequest("Department id is required");
        await assertOrgLinks({ departmentId: input.value, teamId: toId(employee.teamId) || null });
        employee.departmentId = new mongoose.Types.ObjectId(input.value);
        await employee.save();
        await writeHistory({
          employeeId,
          action: "DEPARTMENT_CHANGED",
          newValue: input.value,
          performedBy: actor.id,
          reason: input.reason,
        });
      } else if (input.operation === "ASSIGN_TEAM") {
        if (!input.value) throw badRequest("Team id is required");
        const team = await Team.findById(input.value);
        if (!team) throw badRequest("Team not found");
        employee.teamId = team._id;
        employee.departmentId = team.departmentId;
        await employee.save();
        await writeHistory({
          employeeId,
          action: "TEAM_CHANGED",
          newValue: input.value,
          performedBy: actor.id,
          reason: input.reason,
        });
      } else if (input.operation === "CHANGE_MANAGER") {
        if (!input.value) throw badRequest("Manager id is required");
        await assertOrgLinks({ managerId: input.value, selfId: employeeId });
        employee.managerId = new mongoose.Types.ObjectId(input.value);
        await employee.save();
        await writeHistory({
          employeeId,
          action: "MANAGER_CHANGED",
          newValue: input.value,
          performedBy: actor.id,
          reason: input.reason,
        });
      } else if (input.operation === "ACTIVATE") {
        await User.updateOne({ _id: employee.userId }, { status: "active" });
      } else if (input.operation === "DEACTIVATE") {
        await User.updateOne({ _id: employee.userId }, { status: "inactive" });
      }
      results.push({ id: employeeId, ok: true });
    } catch (error) {
      results.push({
        id: employeeId,
        ok: false,
        message: error instanceof Error ? error.message : "Failed",
      });
    }
  }

  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_UPDATED",
    resourceType: "employee",
    metadata: { operation: input.operation, count: input.employeeIds.length },
    req,
  });

  return { results };
}

export async function exportEmployeesCsv(actor: Actor, query: ListEmployeesQuery): Promise<string> {
  const data = await listEmployees(actor, { ...query, page: 1, limit: 100 });
  const header = [
    "employeeCode",
    "firstName",
    "lastName",
    "email",
    "jobTitle",
    "department",
    "team",
    "manager",
    "employmentType",
    "employmentStatus",
    "workMode",
    "location",
    "joiningDate",
  ];
  const lines = [header.join(",")];
  for (const row of data.employees) {
    const values = [
      row.employeeCode,
      row.firstName,
      row.lastName,
      row.email,
      row.jobTitle,
      row.department?.name ?? "",
      row.team?.name ?? "",
      row.manager?.name ?? "",
      row.employmentType,
      row.employmentStatus,
      row.workMode,
      row.location,
      row.joiningDate ? new Date(row.joiningDate).toISOString().slice(0, 10) : "",
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`);
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export async function getInvitation(token: string) {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) {
    throw notFound("Invitation not found", "INVITATION_NOT_FOUND");
  }
  if (invitation.acceptedAt) {
    throw badRequest("Invitation has already been used", "INVITATION_USED");
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw badRequest("Invitation has expired", "INVITATION_EXPIRED");
  }
  const employee = await findEmployee(String(invitation.employeeId));
  return {
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    employee: employeeListDTO(employee),
  };
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(input.token) });
  if (!invitation) {
    throw notFound("Invitation not found", "INVITATION_NOT_FOUND");
  }
  if (invitation.acceptedAt) {
    throw badRequest("Invitation has already been used", "INVITATION_USED");
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw badRequest("Invitation has expired", "INVITATION_EXPIRED");
  }

  const accepted = await Invitation.findOneAndUpdate(
    { _id: invitation._id, acceptedAt: null, expiresAt: { $gt: new Date() } },
    { acceptedAt: new Date() },
    { new: true }
  );
  if (!accepted) {
    throw badRequest("Invitation is no longer valid", "INVITATION_USED");
  }

  const user = await User.findById(invitation.userId).select("+passwordHash");
  const employee = await Employee.findById(invitation.employeeId);
  if (!user || !employee) {
    throw notFound("Invitation target not found");
  }

  user.passwordHash = await hashPassword(input.password);
  user.status = "active";
  user.approvedAt = new Date();
  await user.save();

  if (input.phone) employee.phone = input.phone;
  if (input.address) employee.address = { ...employee.address, ...input.address };
  if (input.emergencyContact) {
    employee.emergencyContact = { ...employee.emergencyContact, ...input.emergencyContact };
  }
  const complete =
    Boolean(employee.phone) &&
    Boolean(employee.emergencyContact?.name) &&
    Boolean(employee.emergencyContact?.phone);
  employee.employmentStatus = complete ? "ACTIVE" : "ONBOARDING";
  await employee.save();

  await writeAudit({
    actorId: user.id,
    action: "EMPLOYEE_APPROVED",
    resourceType: "employee",
    resourceId: employee.id,
  });
  await notify({
    recipientId: user.id,
    type: "ACCOUNT_APPROVED",
    title: "Welcome aboard",
    message: "Your invitation was accepted. You can now sign in.",
  });

  return { message: "Invitation accepted. You can now sign in." };
}

export async function getEmployeeHistory(actor: Actor, id: string) {
  await assertEmployeeInScope(actor, id);
  await findEmployee(id, true);
  const { EmployeeHistory } = await import("../models/employee-history.model.js");
  const rows = await EmployeeHistory.find({ employeeId: id }).sort({ createdAt: -1 }).limit(100);
  return rows;
}
