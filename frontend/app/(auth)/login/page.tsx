"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/layout/AuthShell";
import { Alert, Button, Field, Input } from "@/components/ui/primitives";

const schema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthShell
      kicker="Welcome back"
      headline={
        <>
          People.
          <br />
          Access.
          <br />
          Trust.
        </>
      }
      lede="A quiet command surface for the roster — approve with intent, revoke with a record."
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Sign in</p>
      <h1 className="mt-3 text-4xl font-semibold leading-none tracking-tight text-ink">Open the desk</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Use your approved credentials to enter the operations console.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setServerError(null);
          try {
            await login(values.email, values.password);
            router.replace("/dashboard");
          } catch (error) {
            setServerError(error instanceof Error ? error.message : "Login failed");
          }
        })}
      >
        {serverError ? <Alert>{serverError}</Alert> : null}
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>
        <Button className="mt-2 w-full py-2.5" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Enter console"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-mute">
        Need an account?{" "}
        <Link href="/signup" className="text-gold underline-offset-4 hover:underline">
          Request access
        </Link>
      </p>
    </AuthShell>
  );
}
