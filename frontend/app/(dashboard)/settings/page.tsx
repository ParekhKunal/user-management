"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { Alert, Button, Card, Field, Input, PageHeader, Select } from "@/components/ui/primitives";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data, reload } = useSettings(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { organizationName: "", organizationCode: "", timezone: "", country: "", defaultWorkMode: "HYBRID" as "ONSITE" | "REMOTE" | "HYBRID" },
  });

  useEffect(() => {
    if (data) form.reset({
      organizationName: data.organizationName,
      organizationCode: data.organizationCode,
      timezone: data.timezone,
      country: data.country,
      defaultWorkMode: data.defaultWorkMode,
    });
  }, [data, form]);

  if (!user) return null;
  const canEdit = hasPermission(user, "settings.update");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Administration" title="Organization settings" description="Name, timezone, and default work mode." />
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="emerald">{message}</Alert> : null}
      <Card>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            setMessage(null);
            try {
              await api.patch("/settings/organization", values);
              await reload();
              setMessage("Settings saved");
            } catch (err) {
              setError(getApiErrorMessage(err, "Could not save settings"));
            }
          })}
        >
          <Field label="Name"><Input disabled={!canEdit} {...form.register("organizationName")} /></Field>
          <Field label="Code"><Input disabled={!canEdit} {...form.register("organizationCode")} /></Field>
          <Field label="Timezone"><Input disabled={!canEdit} {...form.register("timezone")} /></Field>
          <Field label="Country"><Input disabled={!canEdit} {...form.register("country")} /></Field>
          <Field label="Default work mode">
            <Select disabled={!canEdit} {...form.register("defaultWorkMode")}>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
              <option value="REMOTE">Remote</option>
            </Select>
          </Field>
          {canEdit ? <div className="md:col-span-2"><Button>Save settings</Button></div> : null}
        </form>
      </Card>
    </div>
  );
}
