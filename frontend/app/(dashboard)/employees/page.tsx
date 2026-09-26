"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments, useEmployees, useTeams } from "@/hooks/usePlatform";
import { api, getApiErrorMessage } from "@/lib/api";
import { employmentLabel, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  buttonClass,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";
import type { Employee, EmploymentStatus } from "@/types/platform";

const statuses: Array<EmploymentStatus | ""> = [
  "",
  "ONBOARDING",
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
];

export default function EmployeesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [department, setDepartment] = useState("");
  const [team, setTeam] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">("");
  const [sort, setSort] = useState("createdAt");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({ page, limit: 10, search, department, team, employmentStatus, sort }),
    [page, search, department, team, employmentStatus, sort]
  );
  const { data, loading, reload } = useEmployees(params, Boolean(user));
  const departments = useDepartments(Boolean(user));
  const teams = useTeams(Boolean(user), department || undefined);

  if (!user) return null;

  async function run(action: () => Promise<void>, successMessage: string) {
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(successMessage);
      setSelected([]);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Action failed"));
    }
  }

  async function bulk(operation: string, value?: string) {
    if (selected.length === 0) return;
    await run(
      () => api.post("/employees/bulk-update", { employeeIds: selected, operation, value }).then(() => undefined),
      "Bulk update completed"
    );
  }

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="People"
        title="Employees"
        description="Search the roster, filter by structure, and keep lifecycle current."
        actions={
          hasPermission(user, "employees.create") ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  const response = await api.get("/employees/export", { params: { format: "csv", ...params }, responseType: "blob" });
                  const url = URL.createObjectURL(response.data);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "employees.csv";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </Button>
              <Link href="/employees/new" className={buttonClass()}>
                Invite employee
              </Link>
            </div>
          ) : null
        }
      />

      <Card>
        <form
          className="grid gap-4 lg:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <Input className="pl-10" placeholder="Name, email, code, title" value={draft} onChange={(event) => setDraft(event.target.value)} />
          </div>
          <Select value={department} onChange={(event) => { setDepartment(event.target.value); setTeam(""); setPage(1); }}>
            <option value="">All departments</option>
            {departments.data?.departments.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
          <Select value={team} onChange={(event) => { setTeam(event.target.value); setPage(1); }}>
            <option value="">All teams</option>
            {teams.data?.teams.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
          <Select value={employmentStatus} onChange={(event) => { setEmploymentStatus(event.target.value as EmploymentStatus | ""); setPage(1); }}>
            {statuses.map((item) => (
              <option key={item || "all"} value={item}>{item ? employmentLabel(item) : "All statuses"}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="createdAt">Newest</option>
            <option value="name">Name</option>
            <option value="employeeCode">Code</option>
            <option value="joiningDate">Joining date</option>
          </Select>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </Card>

      {selected.length > 0 && hasPermission(user, "employees.update") ? (
        <Card title={`${selected.length} selected`}>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void bulk("ACTIVATE")}>Activate</Button>
            <Button variant="secondary" onClick={() => void bulk("DEACTIVATE")}>Deactivate</Button>
            <Select
              className="max-w-xs"
              onChange={(event) => {
                if (event.target.value) void bulk("ASSIGN_DEPARTMENT", event.target.value);
              }}
            >
              <option value="">Assign department</option>
              {departments.data?.departments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Select
              className="max-w-xs"
              onChange={(event) => {
                if (event.target.value) void bulk("ASSIGN_TEAM", event.target.value);
              }}
            >
              <option value="">Assign team</option>
              {teams.data?.teams.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </div>
        </Card>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="emerald">{message}</Alert> : null}

      <Card padded={false}>
        {loading || !data ? (
          <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        ) : data.employees.length === 0 ? (
          <EmptyState title="No employees found" description="Invite someone, or widen the filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <thead className="border-b border-line bg-canvas">
                  <tr>
                    <Th><input type="checkbox" aria-label="Select page" onChange={(event) => setSelected(event.target.checked ? data.employees.map((row) => row.id) : [])} /></Th>
                    <Th>Employee</Th>
                    <Th>Code</Th>
                    <Th>Department</Th>
                    <Th>Team</Th>
                    <Th>Manager</Th>
                    <Th>Title</Th>
                    <Th>Status</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map((employee: Employee) => (
                    <tr key={employee.id} className="border-b border-line last:border-0 hover:bg-canvas">
                      <Td>
                        <input type="checkbox" checked={selected.includes(employee.id)} onChange={() => toggle(employee.id)} aria-label={`Select ${employee.name}`} />
                      </Td>
                      <Td>
                        <Link href={`/employees/${employee.id}`} className="flex items-center gap-3">
                          <Avatar name={employee.name} size="sm" />
                          <div>
                            <p className="font-medium text-ink">{employee.name}</p>
                            <p className="text-xs text-mute">{employee.email}</p>
                          </div>
                        </Link>
                      </Td>
                      <Td className="text-xs tabular text-mute">{employee.employeeCode}</Td>
                      <Td className="text-sm text-mute">{employee.department?.name ?? "—"}</Td>
                      <Td className="text-sm text-mute">{employee.team?.name ?? "—"}</Td>
                      <Td className="text-sm text-mute">{employee.manager?.name ?? "—"}</Td>
                      <Td className="text-sm text-mute">{employee.jobTitle || "—"}</Td>
                      <Td><Badge tone={employee.employmentStatus === "ACTIVE" ? "green" : employee.employmentStatus === "ONBOARDING" ? "amber" : "slate"}>{employmentLabel(employee.employmentStatus)}</Badge></Td>
                      <Td className="whitespace-nowrap text-xs text-mute">{employee.joiningDate ? formatDate(employee.joiningDate) : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-mute">
                Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button variant="secondary" disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
