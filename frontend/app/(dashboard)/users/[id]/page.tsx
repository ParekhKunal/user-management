"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, getApiErrorMessage } from "@/lib/api";
import { canAssignRole, canModifyUser, roleLabel, statusLabel } from "@/lib/permissions";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from "@/components/ui/primitives";
import type { User } from "@/types/user";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("A valid email is required"),
  role: z.enum(["user", "employee", "manager", "hr-manager", "admin", "super-admin"]),
  status: z.enum(["pending", "active", "rejected", "inactive", "locked"]),
});

type FormValues = z.infer<typeof schema>;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: actor } = useAuth();
  const [target, setTarget] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    api
      .get(`/users/${params.id}`)
      .then((response) => {
        const data = response.data.data as User;
        setTarget(data);
        reset({
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
        });
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "Failed to load user"));
      });
  }, [params.id, reset]);

  if (!actor) {
    return null;
  }

  const canEdit = target ? canModifyUser(actor.role, target.role) : false;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to users
        </Link>
        <div className="mt-4">
          <PageHeader
            eyebrow="Account"
            title={target?.name ?? "User"}
            description={canEdit ? "Update role, status, or profile details." : "View only — you cannot modify this account."}
          />
        </div>
      </div>

      {target ? (
        <div className="surface flex items-center gap-4 rounded-xl px-5 py-4">
          <Avatar name={target.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{target.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="indigo">{roleLabel(target.role)}</Badge>
              <Badge
                tone={
                  target.status === "active"
                    ? "green"
                    : target.status === "pending"
                      ? "amber"
                      : target.status === "rejected"
                        ? "rose"
                        : "slate"
                }
              >
                {statusLabel(target.status)}
              </Badge>
            </div>
          </div>
        </div>
      ) : null}

      <Card>
        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert tone="emerald">{message}</Alert> : null}
        {target ? (
          <form
            className="space-y-5"
            onSubmit={handleSubmit(async (values) => {
              setError(null);
              setMessage(null);
              try {
                const response = await api.patch(`/users/${target.id}`, values);
                setTarget(response.data.data);
                setMessage("User updated successfully");
              } catch (err) {
                setError(getApiErrorMessage(err, "Failed to update user"));
              }
            })}
          >
            <Field label="Name" error={errors.name?.message}>
              <Input disabled={!canEdit} invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" disabled={!canEdit} invalid={Boolean(errors.email)} {...register("email")} />
            </Field>
            <Field label="Role" hint="Changes take effect on their next session." error={errors.role?.message}>
              <Select disabled={!canEdit} invalid={Boolean(errors.role)} {...register("role")}>
                <option value="user">User</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr-manager">HR Manager</option>
                <option value="admin">Admin</option>
                {canAssignRole(actor.role, "super-admin") ? (
                  <option value="super-admin">Super Admin</option>
                ) : null}
              </Select>
            </Field>
            <Field
              label="Status"
              hint="Pending users cannot sign in. Inactive suspends an approved account."
              error={errors.status?.message}
            >
              <Select disabled={!canEdit} invalid={Boolean(errors.status)} {...register("status")}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
                <option value="locked">Locked</option>
              </Select>
            </Field>
            {canEdit ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save changes"}</Button>
                {actor.id !== target.id ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${target.name}?`)) {
                        return;
                      }
                      try {
                        await api.delete(`/users/${target.id}`);
                        router.push("/users");
                      } catch (err) {
                        setError(getApiErrorMessage(err, "Failed to delete user"));
                      }
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </form>
        ) : error ? (
          <p className="text-sm text-mute">This account could not be loaded.</p>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}
      </Card>
    </div>
  );
}
