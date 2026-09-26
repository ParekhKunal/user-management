"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { api, getApiErrorMessage } from "@/lib/api";
import { UserTable } from "@/components/users/UserTable";
import {
  Alert,
  Button,
  buttonClass,
  Card,
  Chip,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
} from "@/components/ui/primitives";
import type { UserRole, UserStatus } from "@/types/user";

const roles: Array<{ value: UserRole | ""; label: string }> = [
  { value: "", label: "All roles" },
  { value: "user", label: "User" },
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr-manager", label: "HR" },
  { value: "admin", label: "Admin" },
  { value: "super-admin", label: "Super Admin" },
];

const statuses: Array<{ value: UserStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Inactive" },
  { value: "locked", label: "Locked" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [draftSearch, setDraftSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () => ({ page, limit: 10, search, role, status }),
    [page, search, role, status]
  );
  const { data, loading, reload } = useUsers(query);

  if (!user) {
    return null;
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(successMessage);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Action failed"));
    }
  }

  const totalPages = data?.pagination.totalPages ?? 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Roster"
        title="Users"
        description="Search, filter, and manage accounts without leaving the desk."
        actions={
          <Link href="/users/new" className={buttonClass()}>
            Create user
          </Link>
        }
      />

      <Card>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(draftSearch.trim());
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <Input
                className="pl-10"
                placeholder="Search name or email"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="sm:w-auto">
              Search
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.16em] text-mute">Role</span>
            {roles.map((item) => (
              <Chip
                key={item.label}
                active={role === item.value}
                onClick={() => {
                  setPage(1);
                  setRole(item.value);
                }}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.16em] text-mute">Status</span>
            {statuses.map((item) => (
              <Chip
                key={item.label}
                active={status === item.value}
                onClick={() => {
                  setPage(1);
                  setStatus(item.value);
                }}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </form>
      </Card>

      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="emerald">{message}</Alert> : null}

      <Card padded={false}>
        {loading || !data ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : data.users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try a broader search, or clear the role and status filters."
          />
        ) : (
          <>
            <UserTable
              users={data.users}
              actorRole={user.role}
              actorId={user.id}
              onApprove={(target) =>
                runAction(() => api.patch(`/users/${target.id}/approve`).then(() => undefined), "User approved")
              }
              onReject={(target) =>
                runAction(() => api.patch(`/users/${target.id}/reject`).then(() => undefined), "User rejected")
              }
              onActivate={(target) =>
                runAction(
                  () => api.patch(`/users/${target.id}`, { status: "active" }).then(() => undefined),
                  "User activated"
                )
              }
              onDeactivate={(target) =>
                runAction(
                  () => api.patch(`/users/${target.id}`, { status: "inactive" }).then(() => undefined),
                  "User deactivated"
                )
              }
              onDelete={(target) => {
                if (window.confirm(`Delete ${target.name}? This is a soft delete.`)) {
                  void runAction(
                    () => api.delete(`/users/${target.id}`).then(() => undefined),
                    "User deleted"
                  );
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
                Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} users
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  disabled={data.pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    className={
                      number === data.pagination.page
                        ? "h-9 min-w-9 rounded-md bg-gold px-2 text-[13px] font-medium text-white"
                        : "h-9 min-w-9 rounded-md px-2 text-[13px] text-mute hover:bg-canvas hover:text-ink"
                    }
                  >
                    {number}
                  </button>
                ))}
                <Button
                  variant="secondary"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
