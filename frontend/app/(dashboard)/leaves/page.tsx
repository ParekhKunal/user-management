"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { employeeName, leaveTypeName, useTeamLeaves } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";

export default function LeavesPage() {
  const { user } = useAuth();
  const { data, loading, reload } = useTeamLeaves(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function decide(id: string, action: "approve" | "reject") {
    setError(null);
    try {
      await api.patch(`/leaves/${id}/${action}`, { reviewComment: action === "reject" ? "Rejected from the desk" : "Approved" });
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Action failed"));
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Requests" title="Leave" description="Review team and organization leave requests." />
      {error ? <Alert>{error}</Alert> : null}
      <Card padded={false}>
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : data.leaves.length === 0 ? (
          <EmptyState title="No leave requests" />
        ) : (
          <Table>
            <thead className="border-b border-line bg-canvas">
              <tr><Th>Employee</Th><Th>Type</Th><Th>Dates</Th><Th>Days</Th><Th>Status</Th><Th></Th></tr>
            </thead>
            <tbody>
              {data.leaves.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <Td className="font-medium text-ink">{employeeName(row.employeeId)}</Td>
                  <Td className="text-mute">{leaveTypeName(row.leaveTypeId)}</Td>
                  <Td className="text-sm text-mute">{formatDate(row.startDate)} – {formatDate(row.endDate)}</Td>
                  <Td className="tabular">{row.numberOfDays}</Td>
                  <Td><Badge tone={row.status === "APPROVED" ? "green" : row.status === "PENDING" ? "amber" : row.status === "REJECTED" ? "rose" : "slate"}>{row.status}</Badge></Td>
                  <Td>
                    {row.status === "PENDING" && hasPermission(user, "leave.approve") ? (
                      <div className="flex gap-2">
                        <Button onClick={() => void decide(row.id, "approve")}>Approve</Button>
                        <Button variant="secondary" onClick={() => void decide(row.id, "reject")}>Reject</Button>
                      </div>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
