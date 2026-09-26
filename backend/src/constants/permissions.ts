export const PERMISSIONS = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "employees.read",
  "employees.create",
  "employees.update",
  "employees.delete",
  "employees.approve",
  "employees.activate",
  "employees.deactivate",
  "departments.read",
  "departments.create",
  "departments.update",
  "departments.delete",
  "teams.read",
  "teams.create",
  "teams.update",
  "teams.delete",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "permissions.read",
  "permissions.assign",
  "attendance.read",
  "attendance.manage",
  "leave.read",
  "leave.create",
  "leave.approve",
  "leave.reject",
  "audit.read",
  "settings.read",
  "settings.update",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const CRITICAL_PERMISSIONS: Permission[] = [
  "permissions.assign",
  "roles.create",
  "roles.update",
  "roles.delete",
  "settings.update",
];

/** Cannot be removed from the Super Admin role — prevents lockout of role/permission management. */
export const SUPER_ADMIN_LOCKED_PERMISSIONS: Permission[] = [
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "permissions.read",
  "permissions.assign",
];

export const PERMISSION_GROUPS = [
  { key: "users", label: "Users" },
  { key: "employees", label: "Employees" },
  { key: "departments", label: "Departments" },
  { key: "teams", label: "Teams" },
  { key: "roles", label: "Roles" },
  { key: "permissions", label: "Permissions" },
  { key: "attendance", label: "Attendance" },
  { key: "leave", label: "Leave" },
  { key: "audit", label: "Audit" },
  { key: "settings", label: "Settings" },
] as const;

export type PermissionGroupKey = (typeof PERMISSION_GROUPS)[number]["key"];

export const SYSTEM_ROLES = [
  "super-admin",
  "admin",
  "hr-manager",
  "manager",
  "employee",
  "user",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  "super-admin": [...PERMISSIONS],
  admin: PERMISSIONS.filter((permission) => !CRITICAL_PERMISSIONS.includes(permission)),
  "hr-manager": [
    "employees.read",
    "employees.create",
    "employees.update",
    "employees.approve",
    "employees.activate",
    "employees.deactivate",
    "departments.read",
    "teams.read",
    "attendance.read",
    "leave.read",
    "leave.create",
    "leave.approve",
    "leave.reject",
    "users.read",
  ],
  manager: [
    "employees.read",
    "attendance.read",
    "leave.read",
    "leave.create",
    "leave.approve",
    "leave.reject",
  ],
  employee: ["employees.read", "attendance.read", "leave.read", "leave.create"],
  user: ["employees.read", "attendance.read", "leave.read", "leave.create"],
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function defaultPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as SystemRole] ? [...ROLE_PERMISSIONS[role as SystemRole]] : [];
}

export function mergePermissions(base: readonly string[], extra: readonly string[] = []): Permission[] {
  return [...new Set([...base, ...extra].filter(isPermission))];
}

/** Default-map merge. Runtime auth uses stored Role documents, not this helper. */
export function resolveRolePermissions(role: string, extra: string[] = []): Permission[] {
  return mergePermissions(defaultPermissionsForRole(role), extra);
}

export function applySuperAdminLock(roleSlug: string, permissions: readonly string[]): Permission[] {
  const next = mergePermissions(permissions);
  if (roleSlug !== "super-admin") {
    return next;
  }
  return mergePermissions(next, SUPER_ADMIN_LOCKED_PERMISSIONS);
}

export function isSuperAdminLockedPermission(roleSlug: string, permission: string): boolean {
  return roleSlug === "super-admin" && SUPER_ADMIN_LOCKED_PERMISSIONS.includes(permission as Permission);
}

export function permissionGroupKey(permission: string): string {
  return permission.split(".")[0] ?? permission;
}

export function groupPermissions<T extends { key: string }>(items: T[]) {
  return PERMISSION_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    permissions: items.filter((item) => permissionGroupKey(item.key) === group.key),
  })).filter((group) => group.permissions.length > 0);
}

export function hasPermission(granted: readonly string[], required: Permission): boolean {
  return granted.includes(required);
}
