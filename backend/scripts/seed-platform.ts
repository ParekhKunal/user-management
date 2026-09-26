import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { env } from "../src/config/env.js";
import { PERMISSIONS, ROLE_PERMISSIONS, SYSTEM_ROLES, applySuperAdminLock } from "../src/constants/permissions.js";
import { PermissionCatalog } from "../src/models/permission.model.js";
import { Role } from "../src/models/role.model.js";
import { User } from "../src/models/user.model.js";
import { hashPassword } from "../src/utils/password.js";

const ROLE_NAMES: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "hr-manager": "HR Manager",
  manager: "Manager",
  employee: "Employee",
  user: "User",
};

async function upsertSuperAdmin(): Promise<void> {
  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = "System Super Admin";
    existing.role = "super-admin";
    existing.status = "active";
    existing.deletedAt = null;
    existing.passwordHash = passwordHash;
    existing.approvedAt = existing.approvedAt ?? new Date();
    await existing.save();
    return;
  }
  await User.create({
    name: "System Super Admin",
    email,
    passwordHash,
    role: "super-admin",
    status: "active",
    approvedAt: new Date(),
  });
}

async function seed(): Promise<void> {
  await connectDatabase();

  for (const key of PERMISSIONS) {
    await PermissionCatalog.updateOne(
      { key },
      { key, name: key, description: `Allows ${key.replace(".", " ")}` },
      { upsert: true }
    );
  }

  for (const slug of SYSTEM_ROLES) {
    const existing = await Role.findOne({ slug });
    if (existing) {
      existing.name = ROLE_NAMES[slug] ?? existing.name;
      existing.description = `System role: ${ROLE_NAMES[slug]}`;
      existing.system = true;
      existing.permissions = applySuperAdminLock(slug, existing.permissions);
      await existing.save();
      continue;
    }
    await Role.create({
      slug,
      name: ROLE_NAMES[slug],
      description: `System role: ${ROLE_NAMES[slug]}`,
      permissions: ROLE_PERMISSIONS[slug],
      system: true,
    });
  }

  await upsertSuperAdmin();

  console.log("Seed complete. Super Admin only — no demo people or org data.");
  console.log(`Super Admin: ${env.SUPER_ADMIN_EMAIL} / ${env.SUPER_ADMIN_PASSWORD}`);

  await disconnectDatabase();
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
