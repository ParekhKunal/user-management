"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments, useEmployees, useTeams } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { Alert, Button, buttonClass, Card, Field, Input, PageHeader, Select } from "@/components/ui/primitives";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY", "FREELANCER"]),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  managerId: z.string().optional(),
  location: z.string().optional(),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
  joiningDate: z.string().optional(),
  role: z.enum(["employee", "manager", "hr-manager"]),
  invite: z.enum(["yes", "no"]),
});

type FormValues = z.infer<typeof schema>;

export default function NewEmployeePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const departments = useDepartments(true);
  const teams = useTeams(true);
  const managers = useEmployees({ limit: 100 }, true);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employmentType: "FULL_TIME", workMode: "HYBRID", role: "employee", invite: "yes" },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to employees
        </Link>
        <div className="mt-4">
          <PageHeader eyebrow="Onboarding" title="Invite employee" description="Creates a pending account, an employee record, and a one-time invitation." />
        </div>
      </div>

      {inviteUrl ? (
        <Card title="Invitation ready" description="Share this link. It expires in 24 hours and can be used once.">
          <p className="break-all rounded-md bg-canvas px-3 py-3 text-sm text-ink">{inviteUrl}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => router.push("/employees")}>Done</Button>
            <Link href="/employees/new" className={buttonClass("secondary")}>Invite another</Link>
          </div>
        </Card>
      ) : (
        <Card>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                const response = await api.post("/employees", {
                  ...values,
                  departmentId: values.departmentId || undefined,
                  teamId: values.teamId || undefined,
                  managerId: values.managerId || undefined,
                  invite: values.invite === "yes",
                });
                const token = response.data.data.invitationToken as string | undefined;
                if (token) {
                  setInviteUrl(`${window.location.origin}/invitation?token=${token}`);
                } else {
                  router.push("/employees");
                }
              } catch (err) {
                setError(getApiErrorMessage(err, "Failed to create employee"));
              }
            })}
          >
            {error ? <div className="md:col-span-2"><Alert>{error}</Alert></div> : null}
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Job title">
              <Input {...form.register("jobTitle")} />
            </Field>
            <Field label="Employment type">
              <Select {...form.register("employmentType")}>
                <option value="FULL_TIME">Full time</option>
                <option value="PART_TIME">Part time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="FREELANCER">Freelancer</option>
              </Select>
            </Field>
            <Field label="Department">
              <Select {...form.register("departmentId")}>
                <option value="">Unassigned</option>
                {departments.data?.departments.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Team">
              <Select {...form.register("teamId")}>
                <option value="">Unassigned</option>
                {teams.data?.teams.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Manager">
              <Select {...form.register("managerId")}>
                <option value="">Unassigned</option>
                {managers.data?.employees.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Location">
              <Input {...form.register("location")} />
            </Field>
            <Field label="Work mode">
              <Select {...form.register("workMode")}>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">Onsite</option>
                <option value="REMOTE">Remote</option>
              </Select>
            </Field>
            <Field label="Joining date">
              <Input type="date" {...form.register("joiningDate")} />
            </Field>
            <Field label="System role">
              <Select {...form.register("role")}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr-manager">HR Manager</option>
              </Select>
            </Field>
            <Field label="Invitation">
              <Select {...form.register("invite")}>
                <option value="yes">Send invitation (pending)</option>
                <option value="no">Create active account</option>
              </Select>
            </Field>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creating…" : "Create employee"}</Button>
              <Link href="/employees" className={buttonClass("secondary")}>Cancel</Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
