export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
  "TEMPORARY",
  "FREELANCER",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_STATUSES = [
  "ONBOARDING",
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "UNSPECIFIED"] as const;
export type Gender = (typeof GENDERS)[number];

export const LEAVE_TYPE_CODES = [
  "ANNUAL",
  "SICK",
  "CASUAL",
  "UNPAID",
  "MATERNITY",
  "PATERNITY",
  "OTHER",
] as const;

export type LeaveTypeCode = (typeof LEAVE_TYPE_CODES)[number];

export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ENTITY_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const EMPLOYMENT_TRANSITIONS: Record<EmploymentStatus, EmploymentStatus[]> = {
  ONBOARDING: ["ACTIVE", "TERMINATED"],
  ACTIVE: ["ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED", "RETIRED"],
  ON_LEAVE: ["ACTIVE", "SUSPENDED", "RESIGNED", "TERMINATED"],
  SUSPENDED: ["ACTIVE", "TERMINATED", "RESIGNED"],
  RESIGNED: [],
  TERMINATED: [],
  RETIRED: [],
};

export function canTransitionEmployment(
  from: EmploymentStatus,
  to: EmploymentStatus
): boolean {
  if (from === to) {
    return true;
  }
  return EMPLOYMENT_TRANSITIONS[from].includes(to);
}

export const DEFAULT_LEAVE_BALANCES: Record<LeaveTypeCode, number> = {
  ANNUAL: 20,
  SICK: 10,
  CASUAL: 7,
  UNPAID: 0,
  MATERNITY: 90,
  PATERNITY: 15,
  OTHER: 0,
};
