export type UserRole =
  | "super-admin"
  | "admin"
  | "hr-manager"
  | "manager"
  | "employee"
  | "user";

export type UserStatus = "pending" | "active" | "rejected" | "inactive" | "locked";

export type Permission =
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "employees.read"
  | "employees.create"
  | "employees.update"
  | "employees.delete"
  | "employees.approve"
  | "employees.activate"
  | "employees.deactivate"
  | "departments.read"
  | "departments.create"
  | "departments.update"
  | "departments.delete"
  | "teams.read"
  | "teams.create"
  | "teams.update"
  | "teams.delete"
  | "roles.read"
  | "roles.create"
  | "roles.update"
  | "roles.delete"
  | "permissions.read"
  | "permissions.assign"
  | "attendance.read"
  | "attendance.manage"
  | "leave.read"
  | "leave.create"
  | "leave.approve"
  | "leave.reject"
  | "audit.read"
  | "settings.read"
  | "settings.update";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions?: Permission[];
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  recentRegistrations: User[];
}
