"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePendingUsers } from "@/hooks/useUsers";
import { useDashboardActivity, useDashboardSummary } from "@/hooks/usePlatform";
import { canManageUsers, employmentLabel, roleLabel, statusLabel } from "@/lib/permissions";
import { api, getApiErrorMessage } from "@/lib/api";
import { PendingTable } from "@/components/users/PendingTable";
import { Alert, Avatar, Badge, buttonClass, Card, PageHeader, Skeleton } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { User } from "@/types/user";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Stat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("surface relative overflow-hidden rounded-xl px-5 py-5", accent && "ring-1 ring-gold/30")}>
      {accent ? <span className="absolute inset-y-0 left-0 w-0.5 bg-gold" /> : null}
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className="mt-3 text-[2.4rem] font-semibold leading-none tracking-tight tabular text-ink">{value}</p>
      {hint ? <p className="mt-3 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isStaff = user ? canManageUsers(user.role) : false;
  const { data: summary, loading } = useDashboardSummary(Boolean(user));
  const activity = useDashboardActivity(Boolean(user));
  const pending = usePendingUsers(isStaff);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleDecision(target: User, action: "approve" | "reject") {
    setError(null);
    setMessage(null);
    try {
      await api.patch(`/users/${target.id}/${action}`);
      setMessage(`User ${action === "approve" ? "approved" : "rejected"} successfully.`);
      await pending.reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Action failed"));
    }
  }

  const role = user.role;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={greeting()}
        title={role === "employee" || role === "user" ? user.name : "Operations"}
        description={
          role === "super-admin"
            ? "People, structure, leave, and a record of what changed."
            : role === "hr-manager"
              ? "Onboarding, lifecycle, and leave waiting for a decision."
              : role === "manager"
                ? "Your team, their leave, and who is out today."
                : "Your workspace — profile, attendance, and requests."
        }
      />

      {loading || !summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : role === "employee" || role === "user" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Role" value={roleLabel(user.role)} hint={summary.myProfile?.jobTitle || "Assigned access"} />
          <Stat
            label="Department"
            value={summary.myProfile?.department && "name" in summary.myProfile.department ? summary.myProfile.department.name ?? "—" : "—"}
            hint={summary.myProfile?.employeeCode ?? "No employee record"}
          />
          <Stat
            label="Manager"
            value={
              summary.myProfile?.manager
                ? `${summary.myProfile.manager.firstName ?? ""} ${summary.myProfile.manager.lastName ?? ""}`.trim() || "—"
                : "—"
            }
          />
          <Stat
            label="Today"
            value={summary.todayAttendance?.clockIn ? "Clocked in" : "Not in"}
            hint={summary.todayAttendance?.clockOut ? "Shift closed" : "Open the attendance desk"}
            accent={!summary.todayAttendance?.clockIn}
          />
        </div>
      ) : role === "manager" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Team size" value={summary.teamSize} hint="People in your scope" />
          <Stat label="On leave" value={summary.employeesOnLeave} accent={summary.employeesOnLeave > 0} />
          <Stat label="Pending leave" value={summary.pendingLeaveRequests} accent={summary.pendingLeaveRequests > 0} />
          <Stat label="Notifications" value={summary.unreadNotifications} />
        </div>
      ) : role === "hr-manager" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Stat label="Employees" value={summary.totalEmployees} />
          <Stat label="New this week" value={summary.newEmployees} />
          <Stat label="Onboarding" value={summary.pendingOnboarding} accent={summary.pendingOnboarding > 0} />
          <Stat label="Pending leave" value={summary.pendingLeaveRequests} accent={summary.pendingLeaveRequests > 0} />
          <Stat label="On leave" value={summary.employeesOnLeave} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Stat label="Employees" value={summary.totalEmployees} hint="Active records" />
          <Stat label="Active" value={summary.activeEmployees} />
          <Stat label="Pending" value={summary.pendingApprovals} accent={summary.pendingApprovals > 0} />
          <Stat label="Departments" value={summary.departments} />
          <Stat label="Teams" value={summary.teams} />
          <Stat label="On leave" value={summary.employeesOnLeave} />
        </div>
      )}

      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="emerald">{message}</Alert> : null}

      {(role === "employee" || role === "user") && summary ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Leave balance" description="Days remaining this cycle.">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(summary.leaveBalances ?? {}).map(([code, days]) => (
                <div key={code} className="rounded-md border border-line px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-mute">{code}</p>
                  <p className="mt-1 text-2xl font-semibold tabular text-ink">{days}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Shortcuts" description="Self-service without leaving the desk.">
            <div className="flex flex-wrap gap-2">
              <Link href="/profile" className={buttonClass()}>
                Profile
              </Link>
              <Link href="/my-attendance" className={buttonClass("secondary")}>
                Attendance
              </Link>
              <Link href="/my-leave" className={buttonClass("secondary")}>
                Leave
              </Link>
              <Link href="/notifications" className={buttonClass("secondary")}>
                Notifications
              </Link>
            </div>
          </Card>
        </div>
      ) : null}

      {isStaff ? (
        <Card
          padded={false}
          title="Pending approvals"
          description="These accounts cannot sign in until you decide."
        >
          {pending.loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16" />
            </div>
          ) : (
            <PendingTable
              users={pending.users}
              onApprove={(target) => handleDecision(target, "approve")}
              onReject={(target) => handleDecision(target, "reject")}
            />
          )}
        </Card>
      ) : null}

      {activity.data?.items?.length ? (
        <Card padded={false} title="Recent activity" description="The latest recorded changes.">
          <ul className="divide-y divide-line">
            {activity.data.items.slice(0, 8).map((item, index) => (
              <li key={String(item.id ?? index)} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={String((item as { action?: string }).action ?? "Activity")} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{statusLabel(String((item as { action?: string }).action ?? "Update"))}</p>
                  <p className="truncate text-xs text-mute">
                    {String((item as { resourceType?: string }).resourceType ?? (item as { employeeId?: string }).employeeId ?? "")}
                  </p>
                </div>
                {(item as { createdAt?: string }).createdAt ? (
                  <p className="text-[11px] text-mute">{formatDate(String((item as { createdAt?: string }).createdAt))}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {summary?.myProfile?.employmentStatus ? (
        <div className="flex items-center gap-2 text-sm text-mute">
          Employment
          <Badge tone="indigo">{employmentLabel(summary.myProfile.employmentStatus)}</Badge>
        </div>
      ) : null}
    </div>
  );
}
