"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
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
  Card,
  Chip,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from "@/components/ui/primitives";
import type { AttendanceRecord, Employee, LeaveRequest } from "@/types/platform";

const tabs = ["Overview", "Personal", "Employment", "Organization", "Leave", "Attendance", "Activity"] as const;

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; action: string; oldValue: unknown; newValue: unknown; createdAt: string }>>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const departments = useDepartments(true);
  const teams = useTeams(true);
  const managers = useEmployees({ limit: 100 }, true);
  const form = useForm();

  useEffect(() => {
    api.get(`/employees/${params.id}`).then((response) => {
      setEmployee(response.data.data);
      form.reset(response.data.data);
    }).catch((err) => setError(getApiErrorMessage(err, "Failed to load employee")));
    api.get(`/employees/${params.id}/history`).then((response) => setHistory(response.data.data)).catch(() => undefined);
    api.get("/leaves/team", { params: { employeeId: params.id, limit: 20 } }).then((response) => setLeaves(response.data.data.leaves)).catch(() => undefined);
    api.get(`/attendance/${params.id}`, { params: { limit: 20 } }).then((response) => setAttendance(response.data.data.attendance)).catch(() => undefined);
  }, [params.id, form]);

  if (!user) return null;
  const canEdit = hasPermission(user, "employees.update");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to employees
        </Link>
        <div className="mt-4">
          <PageHeader eyebrow={employee?.employeeCode ?? "Employee"} title={employee?.name ?? "Employee"} description={employee?.jobTitle || "Profile, organization, leave, and history."} />
        </div>
      </div>

      {employee ? (
        <div className="surface flex flex-wrap items-center gap-4 rounded-xl px-5 py-5">
          <Avatar name={employee.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-mute">{employee.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="indigo">{employmentLabel(employee.employmentStatus)}</Badge>
              <Badge tone="slate">{employee.department?.name ?? "No department"}</Badge>
            </div>
          </div>
        </div>
      ) : (
        <Skeleton className="h-24 rounded-xl" />
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Chip key={item} active={tab === item} onClick={() => setTab(item)}>{item}</Chip>
        ))}
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="emerald">{message}</Alert> : null}

      {tab === "Overview" && employee ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Organization"><p className="text-sm text-ink">{employee.department?.name ?? "—"} · {employee.team?.name ?? "No team"}</p><p className="mt-2 text-sm text-mute">Manager: {employee.manager?.name ?? "—"}</p></Card>
          <Card title="Employment"><p className="text-sm text-ink">{employmentLabel(employee.employmentType)}</p><p className="mt-2 text-sm text-mute">{employee.workMode} · {employee.location || "No location"}</p></Card>
          <Card title="Joined"><p className="text-sm text-ink">{employee.joiningDate ? formatDate(employee.joiningDate) : "—"}</p></Card>
        </div>
      ) : null}

      {(tab === "Personal" || tab === "Employment" || tab === "Organization") && employee ? (
        <Card title={tab}>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              setMessage(null);
              try {
                const payload =
                  tab === "Personal"
                    ? { phone: values.phone, address: values.address, emergencyContact: values.emergencyContact }
                    : tab === "Employment"
                      ? { jobTitle: values.jobTitle, employmentType: values.employmentType, workMode: values.workMode, location: values.location, joiningDate: values.joiningDate }
                      : { departmentId: values.departmentId || null, teamId: values.teamId || null, managerId: values.managerId || null };
                const response = await api.patch(`/employees/${employee.id}`, payload);
                setEmployee(response.data.data);
                setMessage("Saved");
              } catch (err) {
                setError(getApiErrorMessage(err, "Failed to save"));
              }
            })}
          >
            {tab === "Personal" ? (
              <>
                <Field label="Phone"><Input disabled={!canEdit} {...form.register("phone")} /></Field>
                <Field label="City"><Input disabled={!canEdit} {...form.register("address.city")} /></Field>
                <Field label="Emergency name"><Input disabled={!canEdit} {...form.register("emergencyContact.name")} /></Field>
                <Field label="Emergency phone"><Input disabled={!canEdit} {...form.register("emergencyContact.phone")} /></Field>
              </>
            ) : null}
            {tab === "Employment" ? (
              <>
                <Field label="Job title"><Input disabled={!canEdit} {...form.register("jobTitle")} /></Field>
                <Field label="Type">
                  <Select disabled={!canEdit} {...form.register("employmentType")}>
                    <option value="FULL_TIME">Full time</option>
                    <option value="PART_TIME">Part time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="FREELANCER">Freelancer</option>
                  </Select>
                </Field>
                <Field label="Work mode">
                  <Select disabled={!canEdit} {...form.register("workMode")}>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                  </Select>
                </Field>
                <Field label="Location"><Input disabled={!canEdit} {...form.register("location")} /></Field>
              </>
            ) : null}
            {tab === "Organization" ? (
              <>
                <Field label="Department">
                  <Select disabled={!canEdit} {...form.register("departmentId")}>
                    <option value="">Unassigned</option>
                    {departments.data?.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </Field>
                <Field label="Team">
                  <Select disabled={!canEdit} {...form.register("teamId")}>
                    <option value="">Unassigned</option>
                    {teams.data?.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </Field>
                <Field label="Manager">
                  <Select disabled={!canEdit} {...form.register("managerId")}>
                    <option value="">Unassigned</option>
                    {managers.data?.employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </Field>
              </>
            ) : null}
            {canEdit ? <div className="md:col-span-2"><Button>Save</Button></div> : null}
          </form>
          {tab === "Employment" && canEdit ? (
            <form
              className="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-5"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                try {
                  const response = await api.patch(`/employees/${employee.id}/status`, {
                    employmentStatus: formData.get("employmentStatus"),
                    reason: formData.get("reason"),
                  });
                  setEmployee(response.data.data);
                  setMessage("Status updated");
                } catch (err) {
                  setError(getApiErrorMessage(err, "Invalid status transition"));
                }
              }}
            >
              <Field label="Lifecycle">
                <Select name="employmentStatus" defaultValue={employee.employmentStatus}>
                  {["ONBOARDING", "ACTIVE", "ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED", "RETIRED"].map((item) => (
                    <option key={item} value={item}>{employmentLabel(item)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Reason"><Input name="reason" placeholder="Optional" /></Field>
              <Button variant="secondary">Update status</Button>
            </form>
          ) : null}
        </Card>
      ) : null}

      {tab === "Leave" ? (
        <Card padded={false} title="Leave">
          <ul className="divide-y divide-line">
            {leaves.map((row) => (
              <li key={row.id} className="flex justify-between px-5 py-3 text-sm">
                <span>{formatDate(row.startDate)} – {formatDate(row.endDate)}</span>
                <Badge tone={row.status === "APPROVED" ? "green" : row.status === "PENDING" ? "amber" : "slate"}>{row.status}</Badge>
              </li>
            ))}
            {leaves.length === 0 ? <li className="px-5 py-6 text-sm text-mute">No leave recorded.</li> : null}
          </ul>
        </Card>
      ) : null}

      {tab === "Attendance" ? (
        <Card padded={false} title="Attendance">
          <ul className="divide-y divide-line">
            {attendance.map((row) => (
              <li key={row.id} className="flex justify-between px-5 py-3 text-sm">
                <span>{formatDate(row.date)}</span>
                <span className="text-mute">{row.totalMinutes} min · {row.status}</span>
              </li>
            ))}
            {attendance.length === 0 ? <li className="px-5 py-6 text-sm text-mute">No attendance yet.</li> : null}
          </ul>
        </Card>
      ) : null}

      {tab === "Activity" ? (
        <Card padded={false} title="History">
          <ul className="divide-y divide-line">
            {history.map((row) => (
              <li key={row.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-ink">{employmentLabel(row.action)}</p>
                <p className="text-xs text-mute">{formatDate(row.createdAt)}</p>
              </li>
            ))}
            {history.length === 0 ? <li className="px-5 py-6 text-sm text-mute">No history yet.</li> : null}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
