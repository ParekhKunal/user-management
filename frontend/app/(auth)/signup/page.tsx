"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/layout/AuthShell";
import { Alert, Button, Field, Input } from "@/components/ui/primitives";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthShell
      kicker="Request access"
      headline={
        <>
          Access is
          <br />
          earned.
        </>
      }
      lede="New accounts stay pending until an administrator reviews the request. Nothing is granted by default."
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Create account</p>
      <h1 className="mt-3 text-4xl font-semibold leading-none tracking-tight text-ink">Join the roster</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Submit your details. An administrator must approve before you can sign in.
      </p>

      {success ? (
        <div className="mt-8 space-y-5">
          <Alert tone="emerald">
            Registration submitted. Your account is waiting for administrator approval.
          </Alert>
          <Link
            href="/login"
            className="inline-flex text-sm text-gold underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit(async (values) => {
            setServerError(null);
            try {
              await signup(values.name, values.email, values.password, values.confirmPassword);
              reset();
              setSuccess("Registration submitted for approval.");
            } catch (error) {
              setServerError(error instanceof Error ? error.message : "Signup failed");
            }
          })}
        >
          {serverError ? <Alert>{serverError}</Alert> : null}
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Jane Doe" invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
          <Field
            label="Password"
            hint="Use at least 8 characters."
            error={errors.password?.message}
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
          </Field>
          <Button className="mt-2 w-full py-2.5" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Request approval"}
          </Button>
        </form>
      )}

      {!success ? (
        <p className="mt-8 text-sm text-mute">
          Already approved?{" "}
          <Link href="/login" className="text-gold underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
