"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissionCatalog } from "@/hooks/usePlatform";
import { isSuperAdmin } from "@/lib/permissions";
import { Card, PageHeader, Skeleton } from "@/components/ui/primitives";

export default function PermissionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const catalog = usePermissionCatalog(isSuperAdmin(user));

  useEffect(() => {
    if (user && !isSuperAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || !isSuperAdmin(user)) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Permissions"
        description="Catalog enforced by the API. Assign these on the Role permissions screen."
      />
      {!catalog.data ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {catalog.data.groups.map((group) => (
            <Card key={group.key} title={group.label} description={`${group.permissions.length} grants`}>
              <ul className="divide-y divide-line">
                {group.permissions.map((row) => (
                  <li key={row.key} className="flex flex-wrap justify-between gap-3 py-3">
                    <p className="font-medium text-ink">{row.key}</p>
                    <p className="text-sm text-mute">{row.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
