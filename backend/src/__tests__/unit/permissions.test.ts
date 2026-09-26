import assert from "node:assert/strict";
import test from "node:test";
import {
  CRITICAL_PERMISSIONS,
  ROLE_PERMISSIONS,
  SUPER_ADMIN_LOCKED_PERMISSIONS,
  applySuperAdminLock,
  hasPermission,
  isSuperAdminLockedPermission,
  resolveRolePermissions,
} from "../../constants/permissions.js";
import { canTransitionEmployment } from "../../constants/employment.js";
import {
  assertClockInAllowed,
  assertClockOutAllowed,
  minutesBetween,
} from "../../utils/attendance-rules.js";
import { businessDaysInclusive, rangesOverlap } from "../../utils/leave-rules.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signAccessToken, verifyAccessToken } from "../../utils/jwt.js";

test("super-admin has every permission", () => {
  assert.equal(ROLE_PERMISSIONS["super-admin"].includes("permissions.assign"), true);
  assert.equal(hasPermission(ROLE_PERMISSIONS["super-admin"], "settings.update"), true);
});

test("admin cannot assign critical permissions by default", () => {
  for (const permission of CRITICAL_PERMISSIONS) {
    assert.equal(ROLE_PERMISSIONS.admin.includes(permission), false);
  }
});

test("employee permissions are self-service only", () => {
  assert.equal(ROLE_PERMISSIONS.employee.includes("employees.create"), false);
  assert.equal(ROLE_PERMISSIONS.employee.includes("leave.create"), true);
});

test("extra user permissions are merged against default role map", () => {
  const granted = resolveRolePermissions("employee", ["audit.read"]);
  assert.equal(granted.includes("audit.read"), true);
  assert.equal(granted.includes("leave.create"), true);
});

test("super-admin locked permissions cannot be stripped", () => {
  const stripped = applySuperAdminLock("super-admin", ["employees.read"]);
  for (const permission of SUPER_ADMIN_LOCKED_PERMISSIONS) {
    assert.equal(stripped.includes(permission), true);
    assert.equal(isSuperAdminLockedPermission("super-admin", permission), true);
  }
  assert.equal(stripped.includes("employees.read"), true);
  assert.equal(isSuperAdminLockedPermission("admin", "roles.update"), false);
});

test("other roles stay fully editable including critical permissions", () => {
  const next = applySuperAdminLock("admin", ["employees.read", "permissions.assign"]);
  assert.deepEqual(next.sort(), ["employees.read", "permissions.assign"].sort());
});

test("employment status transitions block rehire", () => {
  assert.equal(canTransitionEmployment("ACTIVE", "ON_LEAVE"), true);
  assert.equal(canTransitionEmployment("TERMINATED", "ACTIVE"), false);
  assert.equal(canTransitionEmployment("ONBOARDING", "ACTIVE"), true);
});

test("attendance rules block duplicate clock-in and invalid clock-out", () => {
  assert.throws(() => assertClockInAllowed({ clockIn: new Date() }));
  assert.throws(() => assertClockOutAllowed(null));
  assert.throws(() => assertClockOutAllowed({ clockIn: new Date(), clockOut: new Date() }));
  assert.equal(minutesBetween(new Date("2026-01-01T09:00:00Z"), new Date("2026-01-01T17:00:00Z")), 480);
});

test("leave rules count weekdays and detect overlap", () => {
  const days = businessDaysInclusive(new Date("2026-09-28"), new Date("2026-10-02"));
  assert.equal(days, 5);
  assert.equal(
    rangesOverlap(new Date("2026-01-01"), new Date("2026-01-05"), new Date("2026-01-05"), new Date("2026-01-08")),
    true
  );
});

test("password hashing is one-way and verifiable", async () => {
  const hash = await hashPassword("Password@123");
  assert.notEqual(hash, "Password@123");
  assert.equal(await comparePassword("Password@123", hash), true);
  assert.equal(await comparePassword("wrong", hash), false);
});

test("JWT access tokens encode role only, not permissions", () => {
  const token = signAccessToken({ sub: "507f1f77bcf86cd799439011", role: "admin" });
  const payload = verifyAccessToken(token);
  assert.equal(payload.role, "admin");
  assert.equal(payload.sub, "507f1f77bcf86cd799439011");
  assert.equal("permissions" in payload, false);
});
