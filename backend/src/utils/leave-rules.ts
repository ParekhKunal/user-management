import { badRequest } from "./app-error.js";
import type { LeaveStatus } from "../constants/employment.js";

export function businessDaysInclusive(start: Date, end: Date): number {
  if (end.getTime() < start.getTime()) {
    throw badRequest("End date must be on or after the start date", "INVALID_DATE_RANGE");
  }

  let days = 0;
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cursor.getTime() <= last.getTime()) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      days += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return Math.max(1, days);
}

export function assertLeaveReviewable(status: LeaveStatus): void {
  if (status !== "PENDING") {
    throw badRequest("Only pending leave requests can be reviewed", "LEAVE_NOT_PENDING");
  }
}

export function assertLeaveCancellable(status: LeaveStatus, isOwner: boolean): void {
  if (!isOwner) {
    throw badRequest("Only the requester can cancel this leave", "LEAVE_NOT_OWNER");
  }
  if (status !== "PENDING") {
    throw badRequest("Only pending leave requests can be cancelled", "LEAVE_NOT_PENDING");
  }
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() <= endB.getTime() && startB.getTime() <= endA.getTime();
}
