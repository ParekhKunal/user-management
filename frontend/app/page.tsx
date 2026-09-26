"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    router.replace(user ? "/dashboard" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-mute">
      <span className="mb-4 h-px w-10 bg-gold/50" />
      <p className="text-2xl font-semibold text-ink">Redirecting</p>
      <p className="mt-2 text-sm">Opening the operations desk…</p>
    </div>
  );
}
