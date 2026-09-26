"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, getApiErrorMessage } from "@/lib/api";
import { AuthShell } from "@/components/layout/AuthShell";
import { Alert, Button, Field, Input } from "@/components/ui/primitives";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function InvitationForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setError("Invitation token is missing");
      return;
    }
    api
      .get(`/invitations/${token}`)
      .then((response) => setEmail(response.data.data.email))
      .catch((err) => setError(getApiErrorMessage(err, "This invitation is not valid")));
  }, [token]);

  return (
    <AuthShell
      kicker="Invitation"
      headline={<>Welcome<br />aboard.</>}
      lede="Set a password to activate your employee account. The link works once and expires in 24 hours."
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Onboarding</p>
      <h1 className="mt-3 text-4xl font-semibold leading-none tracking-tight text-ink">Accept invitation</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        {email ? `This invitation is for ${email}.` : "Open the link from your administrator to continue."}
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            await api.post("/invitations/accept", { ...values, token });
            router.replace("/login");
          } catch (err) {
            setError(getApiErrorMessage(err, "Could not accept invitation"));
          }
        })}
      >
        {error ? <Alert>{error}</Alert> : null}
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
          <Input type="password" {...form.register("confirmPassword")} />
        </Field>
        <Field label="Phone">
          <Input {...form.register("phone")} />
        </Field>
        <Button className="w-full" disabled={form.formState.isSubmitting || !token}>
          {form.formState.isSubmitting ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-mute">Loading invitation…</div>}>
      <InvitationForm />
    </Suspense>
  );
}
