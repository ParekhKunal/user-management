"use client";

import { Avatar, Button, EmptyState } from "@/components/ui/primitives";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { User } from "@/types/user";

export function PendingTable({
  users,
  onApprove,
  onReject,
}: {
  users: User[];
  onApprove: (user: User) => void;
  onReject: (user: User) => void;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Queue is clear"
        description="No registrations are waiting. New signups will appear here for review."
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {users.map((user) => (
        <li key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{user.name}</p>
            <p className="truncate text-sm text-mute">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold">
              {relativeTime(user.createdAt)}
            </p>
            <p className="mt-0.5 text-xs text-mute">{formatDateTime(user.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onApprove(user)}>Approve</Button>
            <Button variant="secondary" onClick={() => onReject(user)}>
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
