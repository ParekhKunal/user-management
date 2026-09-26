"use client";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/usePlatform";
import { api } from "@/lib/api";
import { formatDateTime, relativeTime } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data, loading, reload } = useNotifications(Boolean(user));
  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Approvals, leave decisions, and assignment changes."
        actions={
          <Button variant="secondary" onClick={async () => { await api.patch("/notifications/read-all"); await reload(); }}>
            Mark all read
          </Button>
        }
      />
      <Card padded={false}>
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : data.notifications.length === 0 ? (
          <EmptyState title="Inbox is quiet" />
        ) : (
          <ul className="divide-y divide-line">
            {data.notifications.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-mute">{item.message}</p>
                  <p className="mt-2 text-[11px] text-mute">{relativeTime(item.createdAt)} · {formatDateTime(item.createdAt)}</p>
                </div>
                {!item.readAt ? (
                  <Button variant="ghost" onClick={async () => { await api.patch(`/notifications/${item.id}/read`); await reload(); }}>
                    Mark read
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
