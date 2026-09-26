"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLogs } from "@/hooks/usePlatform";
import { formatDateTime } from "@/lib/format";
import { Card, Input, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [action, setAction] = useState("");
  const { data, loading } = useAuditLogs({ action, page: 1, limit: 30 }, Boolean(user));
  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Audit logs" description="Who changed what, and when." />
      <Card>
        <Input placeholder="Filter by action, e.g. LOGIN_SUCCESS" value={action} onChange={(event) => setAction(event.target.value)} />
      </Card>
      <Card padded={false}>
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : (
          <Table>
            <thead className="border-b border-line bg-canvas"><tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Resource</Th></tr></thead>
            <tbody>
              {data.logs.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <Td className="whitespace-nowrap text-xs text-mute">{formatDateTime(row.createdAt)}</Td>
                  <Td className="text-sm">{typeof row.actorId === "object" && row.actorId ? row.actorId.name ?? row.actorId.email : "System"}</Td>
                  <Td className="font-medium text-ink">{row.action}</Td>
                  <Td className="text-mute">{row.resourceType}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
