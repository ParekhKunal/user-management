import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { createApp } from "../../app.js";
import { connectDatabase, disconnectDatabase } from "../../config/database.js";
import { ROLE_PERMISSIONS, SUPER_ADMIN_LOCKED_PERMISSIONS } from "../../constants/permissions.js";
import { Role } from "../../models/role.model.js";
import { User } from "../../models/user.model.js";
import { hashPassword } from "../../utils/password.js";
import { invalidateRolePermissionCache } from "../../services/role-permissions.js";

const PASSWORD = "RolePerms@Test1";
const MISSING_EMPLOYEE_ID = "507f1f77bcf86cd799439011";

type JsonBody = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server");
  }
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {}
): Promise<{ status: number; body: JsonBody }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body = (await response.json()) as JsonBody;
  return { status: response.status, body };
}

async function login(baseUrl: string, email: string): Promise<string> {
  const result = await request(baseUrl, "POST", "/api/auth/login", {
    body: { email, password: PASSWORD },
  });
  assert.equal(result.status, 200, result.body.message ?? "login failed");
  const token = result.body.data?.accessToken;
  assert.equal(typeof token, "string");
  return token as string;
}

test("removing a permission from admin takes effect immediately and Super Admin stays gated", async (t) => {
  try {
    await connectDatabase();
  } catch (error) {
    t.skip(`Mongo is not available: ${error instanceof Error ? error.message : "unknown error"}`);
    return;
  }

  const suffix = `${Date.now()}`;
  const superEmail = `sa.roleperm.${suffix}@example.com`;
  const adminEmail = `admin.roleperm.${suffix}@example.com`;
  const [adminRole, superRole] = await Promise.all([Role.findOne({ slug: "admin" }), Role.findOne({ slug: "super-admin" })]);
  const previousAdminPermissions = adminRole ? [...adminRole.permissions] : [...ROLE_PERMISSIONS.admin];
  const previousSuperPermissions = superRole ? [...superRole.permissions] : [...ROLE_PERMISSIONS["super-admin"]];

  if (!adminRole) {
    await Role.create({
      slug: "admin",
      name: "Admin",
      description: "System role: Admin",
      permissions: ROLE_PERMISSIONS.admin,
      system: true,
    });
  }

  const passwordHash = await hashPassword(PASSWORD);
  const [superUser, adminUser] = await Promise.all([
    User.create({
      name: "Role Perm Super",
      email: superEmail,
      passwordHash,
      role: "super-admin",
      status: "active",
      approvedAt: new Date(),
    }),
    User.create({
      name: "Role Perm Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      status: "active",
      approvedAt: new Date(),
    }),
  ]);

  const { server, baseUrl } = await startServer();

  try {
    const superToken = await login(baseUrl, superEmail);
    const adminToken = await login(baseUrl, adminEmail);

    const forbiddenList = await request(baseUrl, "GET", "/api/roles", { token: adminToken });
    assert.equal(forbiddenList.status, 403);

    const forbiddenPatch = await request(baseUrl, "PUT", "/api/roles/admin/permissions", {
      token: adminToken,
      body: { permissions: ["employees.read"] },
    });
    assert.equal(forbiddenPatch.status, 403);

    const nextAdminPermissions = ROLE_PERMISSIONS.admin.filter((permission) => permission !== "employees.delete");
    const updated = await request(baseUrl, "PUT", "/api/roles/admin/permissions", {
      token: superToken,
      body: { permissions: nextAdminPermissions },
    });
    assert.equal(updated.status, 200, updated.body.message ?? "update failed");
    const saved = updated.body.data as { permissions?: string[] };
    assert.equal(saved.permissions?.includes("employees.delete"), false);

    const adminDelete = await request(baseUrl, "DELETE", `/api/employees/${MISSING_EMPLOYEE_ID}`, {
      token: adminToken,
    });
    assert.equal(adminDelete.status, 403);

    const superDelete = await request(baseUrl, "DELETE", `/api/employees/${MISSING_EMPLOYEE_ID}`, {
      token: superToken,
    });
    assert.equal(superDelete.status, 404);

    const lockAttempt = await request(baseUrl, "PUT", "/api/roles/super-admin/permissions", {
      token: superToken,
      body: { permissions: ["employees.read"] },
    });
    assert.equal(lockAttempt.status, 200, lockAttempt.body.message ?? "lock attempt failed");
    const locked = lockAttempt.body.data as { permissions?: string[] };
    for (const permission of SUPER_ADMIN_LOCKED_PERMISSIONS) {
      assert.equal(locked.permissions?.includes(permission), true);
    }
  } finally {
    await Role.updateOne({ slug: "admin" }, { permissions: previousAdminPermissions });
    await Role.updateOne({ slug: "super-admin" }, { permissions: previousSuperPermissions });
    invalidateRolePermissionCache();
    await User.deleteMany({ _id: { $in: [superUser._id, adminUser._id] } });
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await disconnectDatabase();
  }
});
