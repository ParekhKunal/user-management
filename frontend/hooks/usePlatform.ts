"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  AppNotification,
  AttendanceRecord,
  AuditLog,
  DashboardSummary,
  Department,
  Employee,
  EmployeesResponse,
  LeaveRequest,
  LeaveType,
  OrganizationSettings,
  OrgTree,
  PermissionCatalog,
  RoleRecord,
  Team,
} from "@/types/platform";
import type { Pagination } from "@/types/user";

function useResource<T>(path: string, enabled = true, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(path, { params });
      setData(response.data.data as T);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [enabled, path, JSON.stringify(params ?? {})]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function useEmployees(params: Record<string, unknown>, enabled = true) {
  return useResource<EmployeesResponse>("/employees", enabled, params);
}

export function useDepartments(enabled = true) {
  return useResource<{ departments: Department[]; pagination: Pagination }>("/departments", enabled, {
    limit: 100,
  });
}

export function useTeams(enabled = true, departmentId?: string) {
  return useResource<{ teams: Team[]; pagination: Pagination }>("/teams", enabled, {
    limit: 100,
    departmentId,
  });
}

export function useLeaveTypes(enabled = true) {
  return useResource<LeaveType[]>("/leaves/types", enabled);
}

export function useMyLeaves(enabled = true) {
  return useResource<{ leaves: LeaveRequest[]; pagination: Pagination }>("/leaves/me", enabled);
}

export function useTeamLeaves(enabled = true) {
  return useResource<{ leaves: LeaveRequest[]; pagination: Pagination }>("/leaves/team", enabled);
}

export function useMyAttendance(enabled = true) {
  return useResource<{ attendance: AttendanceRecord[]; pagination: Pagination }>("/attendance/me", enabled);
}

export function useTeamAttendance(enabled = true) {
  return useResource<{ attendance: AttendanceRecord[]; pagination: Pagination }>("/attendance/team", enabled);
}

export function useNotifications(enabled = true) {
  return useResource<{ notifications: AppNotification[]; unreadCount: number }>("/notifications", enabled);
}

export function useAuditLogs(params: Record<string, unknown>, enabled = true) {
  return useResource<{ logs: AuditLog[]; pagination: Pagination }>("/audit-logs", enabled, params);
}

export function useSettings(enabled = true) {
  return useResource<OrganizationSettings>("/settings/organization", enabled);
}

export function useRoles(enabled = true) {
  return useResource<RoleRecord[]>("/roles", enabled);
}

export function usePermissionCatalog(enabled = true) {
  return useResource<PermissionCatalog>("/permissions", enabled);
}

export function useDashboardSummary(enabled = true) {
  return useResource<DashboardSummary>("/dashboard/summary", enabled);
}

export function useDashboardActivity(enabled = true) {
  return useResource<{ source: string; items: Array<Record<string, unknown>> }>("/dashboard/recent-activity", enabled);
}

export function useTeamSummary(enabled = true) {
  return useResource<{
    teamSize: number;
    employeesOnLeave: number;
    pendingLeaveRequests: number;
    members: Array<{ id: string; name: string; jobTitle: string; employmentStatus: string; employeeCode: string }>;
  }>("/dashboard/team-summary", enabled);
}

export function useOrgTree(enabled = true) {
  return useResource<OrgTree>("/organization/tree", enabled);
}

export function useMyEmployee(enabled = true) {
  return useResource<Employee>("/employees/me", enabled);
}

export function employeeName(value: LeaveRequest["employeeId"] | AttendanceRecord["employeeId"]): string {
  if (!value) return "Employee";
  if (typeof value === "string") return value;
  const first = value.firstName ?? "";
  const last = "lastName" in value ? value.lastName ?? "" : "";
  return `${first} ${last}`.trim() || "Employee";
}

export function leaveTypeName(value: LeaveRequest["leaveTypeId"]): string {
  if (!value) return "Leave";
  if (typeof value === "string") return value;
  return value.name ?? value.code ?? "Leave";
}
