"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissionCatalog, useRoles } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { isSuperAdmin, roleLabel } from "@/lib/permissions";
import { Alert, Badge, Button, Card, Chip, PageHeader, Skeleton } from "@/components/ui/primitives";
import type { RoleRecord } from "@/types/platform";

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const other = new Set(b);
  return a.every((item) => other.has(item));
}

export default function RolesPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const enabled = isSuperAdmin(user);
  const { data: roles, loading, reload } = useRoles(enabled);
  const catalog = usePermissionCatalog(enabled);
  const [selectedSlug, setSelectedSlug] = useState<string>("admin");
  const [draft, setDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isSuperAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const selected = useMemo(
    () => roles?.find((role) => role.slug === selectedSlug) ?? roles?.[0] ?? null,
    [roles, selectedSlug]
  );

  useEffect(() => {
    if (roles?.length && !roles.some((role) => role.slug === selectedSlug)) {
      setSelectedSlug(roles[0].slug);
    }
  }, [roles, selectedSlug]);

  useEffect(() => {
    if (selected) {
      setDraft([...selected.permissions]);
      setError(null);
      setNotice(null);
    }
  }, [selected?.id, selected?.slug, selected?.updatedAt]);

  if (!user || !isSuperAdmin(user)) return null;

  const locked = new Set(selected?.lockedPermissions ?? []);
  const groups = catalog.data?.groups ?? [];
  const dirty = selected ? !sameSet(draft, selected.permissions) : false;
  const added = selected ? draft.filter((item) => !selected.permissions.includes(item)).length : 0;
  const removed = selected ? selected.permissions.filter((item) => !draft.includes(item)).length : 0;

  function toggle(permission: string) {
    if (locked.has(permission)) return;
    setDraft((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    );
    setNotice(null);
  }

  async function save(role: RoleRecord) {
    if (!dirty) return;
    if (removed >= 3) {
      const confirmed = window.confirm(
        `Remove ${removed} permissions from ${role.name}? That role loses those grants on the next request.`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.put(`/roles/${role.id ?? role.slug}/permissions`, { permissions: draft });
      await reload();
      if (user?.role === role.slug) {
        await refreshUser();
      }
      setNotice(`Saved ${role.name}. Changes apply on the next request.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save role permissions"));
    } finally {
      setSaving(false);
    }
  }

  async function reset(role: RoleRecord) {
    const confirmed = window.confirm(`Reset ${role.name} to its default permission set?`);
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.post(`/roles/${role.id ?? role.slug}/permissions/reset`);
      await reload();
      if (user?.role === role.slug) {
        await refreshUser();
      }
      setNotice(`${role.name} was reset to defaults.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reset role permissions"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Role permissions"
        description="Assign or remove permissions on a role. Unchecking a grant takes effect on that role’s next request."
      />
      {error ? <Alert>{error}</Alert> : null}
      {notice ? <Alert tone="emerald">{notice}</Alert> : null}
      {loading || !roles || !catalog.data ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Card title="Roles" description="Pick a role to edit.">
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <button
                  key={role.slug}
                  type="button"
                  onClick={() => setSelectedSlug(role.slug)}
                  className={`rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selected?.slug === role.slug ? "bg-gold/10 ring-1 ring-gold/30" : "hover:bg-canvas"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{role.name}</span>
                    {role.system ? <Badge tone="slate">System</Badge> : null}
                  </span>
                  <span className="mt-1 block text-[11px] text-mute">
                    {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {selected ? (
            <Card
              title={selected.name}
              description={selected.description || roleLabel(selected.slug)}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" disabled={saving} onClick={() => void reset(selected)}>
                    Reset defaults
                  </Button>
                  <Button disabled={!dirty || saving} onClick={() => void save(selected)}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              }
            >
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Chip active>{draft.length} selected</Chip>
                {dirty ? (
                  <span className="text-xs text-mute">
                    {added ? `+${added} add` : ""}
                    {added && removed ? " · " : ""}
                    {removed ? `−${removed} remove` : ""}
                  </span>
                ) : (
                  <span className="text-xs text-mute">No unsaved changes</span>
                )}
                {selected.slug === "super-admin" ? (
                  <Badge tone="amber">Locked core grants cannot be removed</Badge>
                ) : null}
              </div>

              <div className="space-y-6">
                {groups.map((group) => (
                  <section key={group.key}>
                    <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{group.label}</h3>
                    <ul className="divide-y divide-line rounded-lg ring-1 ring-line">
                      {group.permissions.map((permission) => {
                        const checked = draft.includes(permission.key);
                        const isLocked = locked.has(permission.key);
                        return (
                          <li key={permission.key} className="flex items-start gap-3 px-3 py-2.5">
                            <input
                              id={`perm-${permission.key}`}
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-line text-gold accent-[var(--gold,#b08d57)]"
                              checked={checked}
                              disabled={isLocked || saving}
                              onChange={() => toggle(permission.key)}
                            />
                            <label htmlFor={`perm-${permission.key}`} className="min-w-0 flex-1 cursor-pointer">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-ink">{permission.key}</span>
                                {isLocked ? <Badge tone="amber">Locked</Badge> : null}
                              </span>
                              <span className="mt-0.5 block text-xs text-mute">{permission.description}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
