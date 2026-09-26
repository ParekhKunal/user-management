import type { Pagination } from "./user";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN"
  | "TEMPORARY"
  | "FREELANCER";

export type EmploymentStatus =
  | "ONBOARDING"
  | "ACTIVE"
  | "ON_LEAVE"
  | "SUSPENDED"
  | "RESIGNED"
  | "TERMINATED"
  | "RETIRED";

export type WorkMode = "ONSITE" | "REMOTE" | "HYBRID";

export interface NamedRef {
  id: string;
  name: string;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Employee {
  id: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: string | null;
  gender?: string;
  joiningDate?: string | null;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  jobTitle: string;
  workMode: WorkMode;
  location: string;
  department?: NamedRef | null;
  team?: NamedRef | null;
  manager?: NamedRef | null;
  address?: Address | null;
  emergencyContact?: EmergencyContact | null;
  leaveBalances?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesResponse {
  employees: Employee[];
  pagination: Pagination;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  departmentId: string | { id?: string; _id?: string; name?: string; code?: string };
  managerId?: string | null;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface LeaveType {
  id: string;
  _id?: string;
  code: string;
  name: string;
  defaultDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string | { firstName?: string; lastName?: string; employeeCode?: string };
  leaveTypeId: string | { code?: string; name?: string };
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewComment?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string | { firstName?: string; lastName?: string; employeeCode?: string };
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalMinutes: number;
  status: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | { name?: string; email?: string } | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  createdAt: string;
}

export interface OrganizationSettings {
  organizationName: string;
  organizationCode: string;
  timezone: string;
  country: string;
  defaultWorkMode: WorkMode;
  workingDays: number[];
}

export interface RoleRecord {
  id?: string;
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  permissions: string[];
  system?: boolean;
  lockedPermissions?: string[];
  updatedAt?: string;
}

export interface PermissionRow {
  key: string;
  name: string;
  description: string;
}

export interface PermissionGroup {
  key: string;
  label: string;
  permissions: PermissionRow[];
}

export interface PermissionCatalog {
  permissions: PermissionRow[];
  groups: PermissionGroup[];
}

export interface DashboardSummary {
  role: string;
  totalEmployees: number;
  activeEmployees: number;
  pendingOnboarding: number;
  employeesOnLeave: number;
  departments: number;
  teams: number;
  pendingLeaveRequests: number;
  newEmployees: number;
  pendingApprovals: number;
  unreadNotifications: number;
  teamSize: number;
  leaveBalances: Record<string, number>;
  todayAttendance: AttendanceRecord | null;
  myProfile: {
    id: string;
    name: string;
    employeeCode: string;
    jobTitle: string;
    department?: { name?: string } | null;
    manager?: { firstName?: string; lastName?: string } | null;
    employmentStatus: string;
  } | null;
  users?: {
    totalUsers: number;
    pendingApprovals: number;
    activeUsers: number;
    inactiveUsers: number;
    adminCount: number;
    recentRegistrations: Array<{ id: string; name: string; email: string; status: string; createdAt: string }>;
  } | null;
}

export interface OrgTree {
  organization: string;
  departments: Array<{
    id: string;
    name: string;
    code: string;
    manager?: { name: string } | null;
    teams: Array<{
      id: string;
      name: string;
      manager?: { name: string } | null;
      employees: Array<{ id: string; name: string; jobTitle: string; employeeCode: string }>;
    }>;
    unassignedEmployees: Array<{ id: string; name: string; jobTitle: string }>;
  }>;
}
