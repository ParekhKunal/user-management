"use client";

import { useAuth } from "@/hooks/useAuth";
import { employeeName, useTeamAttendance } from "@/hooks/usePlatform";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";

export default function AttendancePage() {
  const { user } = useAuth();
  const { data, loading } = useTeamAttendance(Boolean(user));
  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Requests" title="Attendance" description="Team clock-in and clock-out history." />
      <Card padded={false}>
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : data.attendance.length === 0 ? (
          <EmptyState title="No attendance yet" />
        ) : (
          <Table>
            <thead className="border-b border-line bg-canvas"><tr><Th>Employee</Th><Th>Date</Th><Th>In</Th><Th>Out</Th><Th>Minutes</Th><Th>Status</Th></tr></thead>
            <tbody>
              {data.attendance.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <Td>{employeeName(row.employeeId)}</Td>
                  <Td className="text-mute">{formatDate(row.date)}</Td>
                  <Td className="text-xs text-mute">{row.clockIn ? formatDateTime(row.clockIn) : "—"}</Td>
                  <Td className="text-xs text-mute">{row.clockOut ? formatDateTime(row.clockOut) : "—"}</Td>
                  <Td className="tabular">{row.totalMinutes}</Td>
                  <Td><Badge tone="slate">{row.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
