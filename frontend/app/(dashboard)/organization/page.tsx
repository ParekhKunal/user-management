"use client";

import { useAuth } from "@/hooks/useAuth";
import { useOrgTree } from "@/hooks/usePlatform";
import { Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";

export default function OrganizationPage() {
  const { user } = useAuth();
  const { data, loading } = useOrgTree(Boolean(user));
  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Organization" title={data?.organization ?? "Structure"} description="Departments, teams, and the people inside them." />
      {loading || !data ? <Skeleton className="h-48 rounded-xl" /> : data.departments.length === 0 ? (
        <EmptyState title="No structure yet" description="Create departments and teams first." />
      ) : (
        <div className="space-y-4">
          {data.departments.map((department) => (
            <Card key={department.id} title={department.name} description={`Code ${department.code}${department.manager ? ` · ${department.manager.name}` : ""}`}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {department.teams.map((team) => (
                  <div key={team.id} className="rounded-lg border border-line px-4 py-4">
                    <p className="font-medium text-ink">{team.name}</p>
                    <p className="text-xs text-mute">{team.manager?.name ?? "No manager"}</p>
                    <ul className="mt-3 space-y-1 text-sm text-mute">
                      {team.employees.map((person) => (
                        <li key={person.id}>{person.name} · {person.jobTitle || "—"}</li>
                      ))}
                      {team.employees.length === 0 ? <li>No people assigned</li> : null}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
