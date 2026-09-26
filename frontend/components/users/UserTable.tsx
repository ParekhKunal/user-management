"use client";

import Link from "next/link";
import { Avatar, Badge, Button, Table, Td, Th } from "@/components/ui/primitives";
import { canModifyUser, roleLabel, statusLabel } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import type { User, UserRole, UserStatus } from "@/types/user";

function statusTone(status: UserStatus) {
  switch (status) {
    case "active":
      return "green" as const;
    case "pending":
      return "amber" as const;
    case "rejected":
      return "rose" as const;
    default:
      return "slate" as const;
  }
}

export function UserTable({
  users,
  actorRole,
  actorId,
  onApprove,
  onReject,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  users: User[];
  actorRole: UserRole;
  actorId: string;
  onApprove: (user: User) => void;
  onReject: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <thead className="border-b border-line bg-canvas">
          <tr>
            <Th>Person</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const canEdit = canModifyUser(actorRole, user.role) && user.id !== actorId;
            return (
              <tr
                key={user.id}
                className="border-b border-line last:border-0 transition-colors hover:bg-canvas"
              >
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{user.name}</p>
                      <p className="truncate text-xs text-mute">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-sm text-mute">{roleLabel(user.role)}</Td>
                <Td>
                  <Badge tone={statusTone(user.status)}>{statusLabel(user.status)}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-xs text-mute">
                  {formatDate(user.createdAt)}
                </Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link
                      href={`/users/${user.id}`}
                      className="inline-flex items-center rounded-md px-2.5 py-1.5 text-[12px] text-gold hover:bg-gold/10"
                    >
                      {canModifyUser(actorRole, user.role) ? "Edit" : "View"}
                    </Link>
                    {user.status === "pending" && canModifyUser(actorRole, user.role) ? (
                      <>
                        <Button variant="ghost" className="px-2.5 py-1.5 text-[12px]" onClick={() => onApprove(user)}>
                          Approve
                        </Button>
                        <Button variant="ghost" className="px-2.5 py-1.5 text-[12px]" onClick={() => onReject(user)}>
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {user.status === "active" && canEdit ? (
                      <Button variant="ghost" className="px-2.5 py-1.5 text-[12px]" onClick={() => onDeactivate(user)}>
                        Deactivate
                      </Button>
                    ) : null}
                    {user.status === "inactive" && canEdit ? (
                      <Button variant="ghost" className="px-2.5 py-1.5 text-[12px]" onClick={() => onActivate(user)}>
                        Activate
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <Button variant="ghost" className="px-2.5 py-1.5 text-[12px] text-danger hover:text-danger" onClick={() => onDelete(user)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
