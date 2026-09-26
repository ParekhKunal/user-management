"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments, useTeams } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Skeleton, Table, Td, Th } from "@/components/ui/primitives";

export default function TeamsPage() {
  const { user } = useAuth();
  const { data, loading, reload } = useTeams(Boolean(user));
  const departments = useDepartments(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ defaultValues: { name: "", code: "", departmentId: "", description: "" } });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="People" title="Teams" description="Teams belong to a department." />
      {error ? <Alert>{error}</Alert> : null}
      {hasPermission(user, "teams.create") ? (
        <Card title="Create team">
          <form
            className="grid gap-4 md:grid-cols-5"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await api.post("/teams", values);
                form.reset();
                await reload();
              } catch (err) {
                setError(getApiErrorMessage(err, "Failed to create team"));
              }
            })}
          >
            <Field label="Name"><Input {...form.register("name", { required: true })} /></Field>
            <Field label="Code"><Input {...form.register("code", { required: true })} /></Field>
            <Field label="Department">
              <Select {...form.register("departmentId", { required: true })}>
                <option value="">Select</option>
                {departments.data?.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="Description"><Input {...form.register("description")} /></Field>
            <div className="flex items-end"><Button>Add</Button></div>
          </form>
        </Card>
      ) : null}
      <Card padded={false}>
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : data.teams.length === 0 ? <EmptyState title="No teams" /> : (
          <Table>
            <thead className="border-b border-line bg-canvas"><tr><Th>Name</Th><Th>Code</Th><Th>Department</Th><Th>Status</Th></tr></thead>
            <tbody>
              {data.teams.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <Td className="font-medium text-ink">{row.name}</Td>
                  <Td className="text-mute">{row.code}</Td>
                  <Td className="text-mute">{typeof row.departmentId === "object" ? row.departmentId.name ?? "—" : "—"}</Td>
                  <Td><Badge tone={row.status === "ACTIVE" ? "green" : "slate"}>{row.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
