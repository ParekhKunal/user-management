"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { leaveTypeName, useLeaveTypes, useMyLeaves } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Skeleton, Textarea } from "@/components/ui/primitives";

export default function MyLeavePage() {
  const { user } = useAuth();
  const leaves = useMyLeaves(Boolean(user));
  const types = useLeaveTypes(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ defaultValues: { leaveTypeId: "", startDate: "", endDate: "", reason: "" } });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Workspace" title="My leave" description="Request time off and follow the review." />
      {error ? <Alert>{error}</Alert> : null}
      <Card title="New request">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            try {
              await api.post("/leaves", values);
              form.reset();
              await leaves.reload();
            } catch (err) {
              setError(getApiErrorMessage(err, "Could not submit leave"));
            }
          })}
        >
          <Field label="Type">
            <Select {...form.register("leaveTypeId", { required: true })}>
              <option value="">Select</option>
              {types.data?.map((item) => (
                <option key={item.id ?? item._id} value={item.id ?? item._id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start"><Input type="date" {...form.register("startDate", { required: true })} /></Field>
          <Field label="End"><Input type="date" {...form.register("endDate", { required: true })} /></Field>
          <Field label="Reason"><Textarea {...form.register("reason", { required: true })} /></Field>
          <div className="md:col-span-2"><Button>Submit request</Button></div>
        </form>
      </Card>
      <Card title="History">
        {leaves.loading ? <Skeleton className="h-16" /> : (
          <ul className="divide-y divide-line">
            {leaves.data?.leaves.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink">{leaveTypeName(row.leaveTypeId)}</p>
                  <p className="text-xs text-mute">{formatDate(row.startDate)} – {formatDate(row.endDate)} · {row.numberOfDays} days</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={row.status === "APPROVED" ? "green" : row.status === "PENDING" ? "amber" : "slate"}>{row.status}</Badge>
                  {row.status === "PENDING" ? (
                    <Button variant="ghost" onClick={async () => { await api.patch(`/leaves/${row.id}/cancel`); await leaves.reload(); }}>Cancel</Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
