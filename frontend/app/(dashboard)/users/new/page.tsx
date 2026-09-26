"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, getApiErrorMessage } from "@/lib/api";
import { canAssignRole } from "@/lib/permissions";
import { Alert, Button, buttonClass, Card, Field, Input, PageHeader, Select } from "@/components/ui/primitives";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "employee", "manager", "hr-manager", "admin", "super-admin"]),
});

type FormValues = z.infer<typeof schema>;

export default function NewUserPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "user" },
  });

  if (!user) {
    return null;
  }

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
            eyebrow="Roster"
            title="Create user"
            description="Administrators can create an active account directly — no approval queue."
          />
        </div>
      </div>

      <Card>
        <form
          className="space-y-5"
          onSubmit={handleSubmit(async (values) => {
            setError(null);
            try {
              await api.post("/users", values);
              router.push("/users");
            } catch (err) {
              setError(getApiErrorMessage(err, "Failed to create user"));
            }
          })}
        >
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Jane Doe" invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Email" hint="This becomes their sign-in address." error={errors.email?.message}>
            <Input
              type="email"
              placeholder="jane@company.com"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
          <Field
            label="Password"
            hint="Minimum 8 characters. They can change it later from their profile."
            error={errors.password?.message}
          >
            <Input
              type="password"
              placeholder="••••••••"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </Field>
          <Field label="Role" hint="Admins manage users. Super Admin is reserved for full control." error={errors.role?.message}>
            <Select invalid={Boolean(errors.role)} {...register("role")}>
              <option value="user">User</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr-manager">HR Manager</option>
              <option value="admin">Admin</option>
              {canAssignRole(user.role, "super-admin") ? (
                <option value="super-admin">Super Admin</option>
              ) : null}
            </Select>
          </Field>
          <div className="flex items-center gap-3 pt-1">
            <Button disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create user"}</Button>
            <Link href="/users" className={buttonClass("secondary")}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
