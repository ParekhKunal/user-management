import { badRequest } from "./app-error.js";

export function assertClockInAllowed(existing?: {
  clockIn?: Date | null;
  clockOut?: Date | null;
} | null): void {
  if (existing?.clockIn) {
    throw badRequest("Already clocked in for this day", "DUPLICATE_CLOCK_IN");
  }
}

export function assertClockOutAllowed(existing?: {
  clockIn?: Date | null;
  clockOut?: Date | null;
} | null): void {
  if (!existing?.clockIn) {
    throw badRequest("Clock-in is required before clock-out", "CLOCK_IN_REQUIRED");
  }
  if (existing.clockOut) {
    throw badRequest("Already clocked out for this day", "DUPLICATE_CLOCK_OUT");
  }
}

export function assertNotFuture(date: Date, now = new Date()): void {
  if (date.getTime() > now.getTime() + 60_000) {
    throw badRequest("Future timestamps are not allowed", "FUTURE_TIMESTAMP");
  }
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

export function attendanceStatusFromMinutes(totalMinutes: number): "PRESENT" | "HALF_DAY" {
  return totalMinutes >= 4 * 60 ? "PRESENT" : "HALF_DAY";
}
