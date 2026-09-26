"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api, getApiErrorMessage } from "@/lib/api";
import { roleLabel, statusLabel } from "@/lib/permissions";
import { useMyEmployee } from "@/hooks/usePlatform";
import { Alert, Avatar, Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui/primitives";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const employee = useMyEmployee(Boolean(user));
  const [employeeMessage, setEmployeeMessage] = useState<string | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your own details. Role and email stay under administrator control."
      />

      <div className="surface flex flex-wrap items-center gap-4 rounded-xl px-5 py-5">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold leading-none tracking-tight text-ink">{user.name}</p>
          <p className="mt-2 truncate text-sm text-mute">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="indigo">{roleLabel(user.role)}</Badge>
          <Badge tone="green">{statusLabel(user.status)}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Display name" description="This is how you appear on the roster.">
          <form
            className="space-y-4"
            onSubmit={profileForm.handleSubmit(async (values) => {
              setProfileError(null);
              setProfileMessage(null);
              try {
                await api.patch("/users/me", values);
                await refreshUser();
                setProfileMessage("Profile updated successfully");
              } catch (error) {
                setProfileError(getApiErrorMessage(error, "Failed to update profile"));
              }
            })}
          >
            {profileError ? <Alert>{profileError}</Alert> : null}
            {profileMessage ? <Alert tone="emerald">{profileMessage}</Alert> : null}
            <Field label="Name" error={profileForm.formState.errors.name?.message}>
              <Input invalid={Boolean(profileForm.formState.errors.name)} {...profileForm.register("name")} />
            </Field>
            <Button disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Card>

        <Card title="Password" description="Choose something you have not used here before.">
          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit(async (values) => {
              setPasswordError(null);
              setPasswordMessage(null);
              try {
                await api.patch("/auth/change-password", values);
                passwordForm.reset();
                setPasswordMessage("Password changed successfully");
              } catch (error) {
                setPasswordError(getApiErrorMessage(error, "Failed to change password"));
              }
            })}
          >
            {passwordError ? <Alert>{passwordError}</Alert> : null}
            {passwordMessage ? <Alert tone="emerald">{passwordMessage}</Alert> : null}
            <Field label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
              <Input
                type="password"
                invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                {...passwordForm.register("currentPassword")}
              />
            </Field>
            <Field
              label="New password"
              hint="At least 8 characters, different from the current one."
              error={passwordForm.formState.errors.newPassword?.message}
            >
              <Input
                type="password"
                invalid={Boolean(passwordForm.formState.errors.newPassword)}
                {...passwordForm.register("newPassword")}
              />
            </Field>
            <Button disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? "Updating…" : "Change password"}
            </Button>
          </form>
        </Card>
      </div>

      {employee.data ? (
        <Card title="Employee details" description="Phone, address, and emergency contact — the fields you can change yourself.">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              setEmployeeError(null);
              setEmployeeMessage(null);
              try {
                await api.patch("/employees/me", {
                  phone: formData.get("phone"),
                  address: {
                    line1: formData.get("line1"),
                    city: formData.get("city"),
                    country: formData.get("country"),
                  },
                  emergencyContact: {
                    name: formData.get("emergencyName"),
                    relationship: formData.get("emergencyRelationship"),
                    phone: formData.get("emergencyPhone"),
                  },
                });
                await employee.reload();
                setEmployeeMessage("Employee profile updated");
              } catch (error) {
                setEmployeeError(getApiErrorMessage(error, "Failed to update employee profile"));
              }
            }}
          >
            {employeeError ? <div className="md:col-span-2"><Alert>{employeeError}</Alert></div> : null}
            {employeeMessage ? <div className="md:col-span-2"><Alert tone="emerald">{employeeMessage}</Alert></div> : null}
            <Field label="Employee code"><Input disabled value={employee.data.employeeCode} /></Field>
            <Field label="Department"><Input disabled value={employee.data.department?.name ?? "—"} /></Field>
            <Field label="Phone"><Input name="phone" defaultValue={employee.data.phone ?? ""} /></Field>
            <Field label="Address"><Input name="line1" defaultValue={employee.data.address?.line1 ?? ""} /></Field>
            <Field label="City"><Input name="city" defaultValue={employee.data.address?.city ?? ""} /></Field>
            <Field label="Country"><Input name="country" defaultValue={employee.data.address?.country ?? ""} /></Field>
            <Field label="Emergency name"><Input name="emergencyName" defaultValue={employee.data.emergencyContact?.name ?? ""} /></Field>
            <Field label="Relationship"><Input name="emergencyRelationship" defaultValue={employee.data.emergencyContact?.relationship ?? ""} /></Field>
            <Field label="Emergency phone"><Input name="emergencyPhone" defaultValue={employee.data.emergencyContact?.phone ?? ""} /></Field>
            <div className="md:col-span-2"><Button>Save employee profile</Button></div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
