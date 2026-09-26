import type { Permission, User, UserRole } from "@/types/user";

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return Boolean(user.permissions?.includes(permission));
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return user?.role === "super-admin";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "super-admin" || role === "admin";
}

export function canModifyUser(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === "super-admin") return true;
  return actorRole === "admin" && targetRole !== "super-admin";
}

export function canAssignRole(actorRole: UserRole, nextRole: UserRole): boolean {
  if (actorRole === "super-admin") return true;
  return actorRole === "admin" && nextRole !== "super-admin";
}

export function roleLabel(role: UserRole | string): string {
  switch (role) {
    case "super-admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "hr-manager":
      return "HR Manager";
    case "manager":
      return "Manager";
    case "employee":
      return "Employee";
    default:
      return "User";
  }
}

export function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function employmentLabel(value: string): string {
  return statusLabel(value);
}
