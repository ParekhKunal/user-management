"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMyAttendance } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { Alert, Badge, Button, Card, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";

export default function MyAttendancePage() {
  const { user } = useAuth();
  const { data, loading, reload } = useMyAttendance(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function punch(path: "/attendance/clock-in" | "/attendance/clock-out") {
    setError(null);
    try {
      await api.post(path);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Attendance action failed"));
    }
  }

  const today = data?.attendance[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="My attendance"
        description="Clock in once per day. Clock out closes the shift."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => void punch("/attendance/clock-in")}>Clock in</Button>
            <Button variant="secondary" onClick={() => void punch("/attendance/clock-out")}>Clock out</Button>
          </div>
        }
      />
      {error ? <Alert>{error}</Alert> : null}
      {today ? (
        <Card title="Latest record">
          <p className="text-sm text-ink">{formatDate(today.date)}</p>
          <p className="mt-2 text-sm text-mute">
            In {today.clockIn ? formatDateTime(today.clockIn) : "—"} · Out {today.clockOut ? formatDateTime(today.clockOut) : "—"}
          </p>
        </Card>
      ) : null}
      <Card padded={false} title="History">
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : (
          <Table>
            <thead className="border-b border-line bg-canvas"><tr><Th>Date</Th><Th>In</Th><Th>Out</Th><Th>Minutes</Th><Th>Status</Th></tr></thead>
            <tbody>
              {data.attendance.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <Td>{formatDate(row.date)}</Td>
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
