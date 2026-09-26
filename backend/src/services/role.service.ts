import mongoose from "mongoose";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SUPER_ADMIN_LOCKED_PERMISSIONS,
  SYSTEM_ROLES,
  applySuperAdminLock,
  defaultPermissionsForRole,
  groupPermissions,
  isPermission,
  type Permission,
  type SystemRole,
} from "../constants/permissions.js";
import { PermissionCatalog } from "../models/permission.model.js";
import { Role, type RoleDocument } from "../models/role.model.js";
import { User } from "../models/user.model.js";
import { writeAudit } from "../utils/audit.js";
import { writeHistory } from "../utils/audit.js";
import { badRequest, forbidden, notFound } from "../utils/app-error.js";
import type { Actor } from "../utils/scope.js";
import type { CreateRoleInput, UpdateRoleInput } from "../validators/organization.validator.js";
import { Employee } from "../models/employee.model.js";
import { invalidateRolePermissionCache } from "./role-permissions.js";

export interface SerializedRole {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
  lockedPermissions: Permission[];
  updatedAt?: Date;
}

function serializeRole(role: RoleDocument | { id?: string; _id?: unknown; slug: string; name: string; description?: string; permissions: Permission[]; system?: boolean; updatedAt?: Date }): SerializedRole {
  const id = role.id ?? (role._id != null ? String(role._id) : role.slug);
  return {
    id,
    slug: role.slug,
    name: role.name,
    description: role.description ?? "",
    permissions: role.permissions.filter(isPermission),
    system: Boolean(role.system),
    lockedPermissions: role.slug === "super-admin" ? [...SUPER_ADMIN_LOCKED_PERMISSIONS] : [],
    updatedAt: role.updatedAt,
  };
}

function assertSuperAdmin(actor: Actor): void {
  if (actor.role !== "super-admin") {
    throw forbidden("Only Super Admin can manage role permissions");
  }
}

export async function findRoleByIdOrSlug(idOrSlug: string): Promise<RoleDocument> {
  if (mongoose.isValidObjectId(idOrSlug)) {
    const byId = await Role.findById(idOrSlug);
    if (byId) return byId;
  }
  const slug = idOrSlug.toLowerCase();
  const bySlug = await Role.findOne({ slug });
  if (bySlug) return bySlug;
  if (SYSTEM_ROLES.includes(slug as SystemRole)) {
    return Role.create({
      slug,
      name: slug,
      description: `System role: ${slug}`,
      permissions: defaultPermissionsForRole(slug),
      system: true,
    });
  }
  throw notFound("Role not found");
}

function normalizePermissionSet(input: string[]): Permission[] {
  const unknown = input.filter((value) => !isPermission(value));
  if (unknown.length > 0) {
    throw badRequest(`Unknown permissions: ${unknown.join(", ")}`);
  }
  return [...new Set(input.filter(isPermission))];
}

export async function listPermissions() {
  const rows = await PermissionCatalog.find().sort({ key: 1 });
  const catalog = (rows.length > 0 ? rows : PERMISSIONS.map((key) => ({ key, name: key, description: key }))).map(
    (row) => ({
      key: row.key,
      name: row.name,
      description: row.description,
    })
  );
  return {
    permissions: catalog,
    groups: groupPermissions(catalog),
  };
}

export async function listRoles() {
  const roles = await Role.find().sort({ system: -1, name: 1 });
  if (roles.length > 0) {
    return roles.map((role) => serializeRole(role));
  }
  return Object.entries(ROLE_PERMISSIONS).map(([slug, permissions]) =>
    serializeRole({
      slug,
      name: slug,
      permissions,
      system: true,
    })
  );
}

export async function getRole(id: string) {
  return serializeRole(await findRoleByIdOrSlug(id));
}

export async function createRole(actor: Actor, input: CreateRoleInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  assertSuperAdmin(actor);
  const permissions = normalizePermissionSet(input.permissions);
  const role = await Role.create({
    slug: input.slug,
    name: input.name,
    description: input.description,
    permissions,
    system: false,
  });
  invalidateRolePermissionCache(role.slug);
  await writeAudit({
    actorId: actor.id,
    action: "ROLE_CHANGED",
    resourceType: "role",
    resourceId: role.id,
    after: { slug: role.slug, permissions },
    req,
  });
  return serializeRole(role);
}

export async function replaceRolePermissions(
  actor: Actor,
  id: string,
  permissions: string[],
  req?: Parameters<typeof writeAudit>[0]["req"]
) {
  assertSuperAdmin(actor);
  const role = await findRoleByIdOrSlug(id);
  const previous = [...role.permissions];
  const next = applySuperAdminLock(role.slug, normalizePermissionSet(permissions));
  role.permissions = next;
  await role.save();
  invalidateRolePermissionCache(role.slug);
  await writeAudit({
    actorId: actor.id,
    action: "PERMISSION_CHANGED",
    resourceType: "role",
    resourceId: role.id,
    before: { permissions: previous },
    after: { permissions: next },
    req,
  });
  return serializeRole(role);
}

export async function resetRolePermissions(actor: Actor, id: string, req?: Parameters<typeof writeAudit>[0]["req"]) {
  const defaults = defaultPermissionsForRole((await findRoleByIdOrSlug(id)).slug);
  return replaceRolePermissions(actor, id, defaults, req);
}

export async function updateRole(actor: Actor, id: string, input: UpdateRoleInput, req?: Parameters<typeof writeAudit>[0]["req"]) {
  assertSuperAdmin(actor);
  const role = await findRoleByIdOrSlug(id);

  if (input.permissions) {
    return replaceRolePermissions(actor, id, input.permissions, req);
  }

  if (input.name) role.name = input.name;
  if (input.description !== undefined) role.description = input.description;
  await role.save();
  await writeAudit({
    actorId: actor.id,
    action: "ROLE_CHANGED",
    resourceType: "role",
    resourceId: role.id,
    after: input as Record<string, unknown>,
    req,
  });
  return serializeRole(role);
}

export async function deleteRole(actor: Actor, id: string, req?: Parameters<typeof writeAudit>[0]["req"]) {
  assertSuperAdmin(actor);
  const role = await findRoleByIdOrSlug(id);
  if (role.system) {
    throw forbidden("System roles cannot be deleted");
  }
  const slug = role.slug;
  await role.deleteOne();
  invalidateRolePermissionCache(slug);
  await writeAudit({
    actorId: actor.id,
    action: "ROLE_CHANGED",
    resourceType: "role",
    resourceId: id,
    req,
  });
}

export async function assignUserRole(actor: Actor, userId: string, roleSlug: string) {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw notFound("User not found");
  if (actor.role !== "super-admin" && (user.role === "super-admin" || roleSlug === "super-admin")) {
    throw forbidden("Only Super Admin can change Super Admin roles");
  }
  const previous = user.role;
  user.role = roleSlug as typeof user.role;
  await user.save();
  const employee = await Employee.findOne({ userId: user._id, deletedAt: null });
  if (employee) {
    await writeHistory({
      employeeId: employee.id,
      action: "ROLE_CHANGED",
      oldValue: previous,
      newValue: roleSlug,
      performedBy: actor.id,
    });
  }
  await writeAudit({
    actorId: actor.id,
    action: "ROLE_CHANGED",
    resourceType: "user",
    resourceId: user.id,
    before: { role: previous },
    after: { role: roleSlug },
  });
  return user;
}
