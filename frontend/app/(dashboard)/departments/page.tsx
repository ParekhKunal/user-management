"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Skeleton, Table, Td, Th } from "@/components/ui/primitives";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { data, loading, reload } = useDepartments(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ defaultValues: { name: "", code: "", description: "", status: "ACTIVE" } });

  if (!user) return null;
  const canWrite = hasPermission(user, "departments.create");

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="People" title="Departments" description="The first layer of the organization." />
      {error ? <Alert>{error}</Alert> : null}
      {canWrite ? (
        <Card title="Create department">
          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await api.post("/departments", values);
                form.reset();
                await reload();
              } catch (err) {
                setError(getApiErrorMessage(err, "Failed to create department"));
              }
            })}
          >
            <Field label="Name"><Input {...form.register("name", { required: true })} /></Field>
            <Field label="Code"><Input {...form.register("code", { required: true })} /></Field>
            <Field label="Description"><Input {...form.register("description")} /></Field>
            <div className="flex items-end"><Button disabled={form.formState.isSubmitting}>Add</Button></div>
          </form>
        </Card>
      ) : null}
      <Card padded={false}>
        {loading || !data ? <div className="p-5"><Skeleton className="h-16" /></div> : data.departments.length === 0 ? (
          <EmptyState title="No departments" />
        ) : (
          <Table>
            <thead className="border-b border-line bg-canvas"><tr><Th>Name</Th><Th>Code</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {data.departments.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <Td className="font-medium text-ink">{row.name}</Td>
                  <Td className="text-mute">{row.code}</Td>
                  <Td><Badge tone={row.status === "ACTIVE" ? "green" : "slate"}>{row.status}</Badge></Td>
                  <Td>
                    {hasPermission(user, "departments.update") ? (
                      <Select
                        defaultValue={row.status}
                        onChange={async (event) => {
                          try {
                            await api.patch(`/departments/${row.id}`, { status: event.target.value });
                            await reload();
                          } catch (err) {
                            setError(getApiErrorMessage(err, "Update failed"));
                          }
                        }}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </Select>
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
