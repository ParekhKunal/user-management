import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import { OrganizationSettings } from "../models/organization-settings.model.js";
import { Team } from "../models/team.model.js";
import { DEFAULT_LEAVE_BALANCES } from "../constants/employment.js";
import { writeAudit } from "../utils/audit.js";
import { toId } from "../utils/ids.js";
import type { Actor } from "../utils/scope.js";
import type { UpdateOrganizationInput } from "../validators/organization.validator.js";

export async function getOrganizationSettings() {
  let settings = await OrganizationSettings.findOne();
  if (!settings) {
    settings = await OrganizationSettings.create({
      organizationName: "KP Technologies",
      organizationCode: "KP",
      timezone: "Asia/Kolkata",
      country: "IN",
      defaultWorkMode: "HYBRID",
      workingDays: [1, 2, 3, 4, 5],
      defaultLeavePolicy: { ...DEFAULT_LEAVE_BALANCES },
    });
  }
  return settings;
}

export async function updateOrganizationSettings(
  actor: Actor,
  input: UpdateOrganizationInput,
  req?: Parameters<typeof writeAudit>[0]["req"]
) {
  const settings = await getOrganizationSettings();
  Object.assign(settings, input);
  await settings.save();
  await writeAudit({
    actorId: actor.id,
    action: "SETTINGS_UPDATED",
    resourceType: "organization",
    resourceId: String(settings._id),
    after: input as Record<string, unknown>,
    req,
  });
  return settings;
}

export async function getOrganizationTree() {
  const settings = await getOrganizationSettings();
  const [departments, teams, employees] = await Promise.all([
    Department.find({ status: "ACTIVE" }).sort({ name: 1 }),
    Team.find({ status: "ACTIVE" }).sort({ name: 1 }),
    Employee.find({ deletedAt: null }).sort({ firstName: 1 }),
  ]);

  const employeeMap = new Map(employees.map((row) => [row.id, row]));

  return {
    organization: settings.organizationName,
    departments: departments.map((department) => {
      const deptTeams = teams.filter((team) => toId(team.departmentId) === department.id);
      return {
        id: department.id,
        name: department.name,
        code: department.code,
        manager: department.managerId ? summary(employeeMap.get(toId(department.managerId))) : null,
        teams: deptTeams.map((team) => ({
          id: team.id,
          name: team.name,
          code: team.code,
          manager: team.managerId ? summary(employeeMap.get(toId(team.managerId))) : null,
          employees: employees
            .filter((employee) => toId(employee.teamId) === team.id)
            .map(summary),
        })),
        unassignedEmployees: employees
          .filter(
            (employee) =>
              toId(employee.departmentId) === department.id && !employee.teamId
          )
          .map(summary),
      };
    }),
  };
}

function summary(employee?: { id: string; firstName: string; lastName: string; jobTitle: string; employeeCode: string } | null) {
  if (!employee) return null;
  return {
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`.trim(),
    jobTitle: employee.jobTitle,
    employeeCode: employee.employeeCode,
  };
}
