import { env } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { User } from "../src/models/user.model.js";
import { hashPassword } from "../src/utils/password.js";

async function seedSuperAdmin(): Promise<void> {
  await connectDatabase();

  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = "System Super Admin";
    existing.role = "super-admin";
    existing.status = "active";
    existing.deletedAt = null;
    existing.passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);
    await existing.save();
    console.log(`Updated Super Admin: ${email}`);
  } else {
    await User.create({
      name: "System Super Admin",
      email,
      passwordHash: await hashPassword(env.SUPER_ADMIN_PASSWORD),
      role: "super-admin",
      status: "active",
      approvedAt: new Date(),
    });
    console.log(`Created Super Admin: ${email}`);
  }

  await disconnectDatabase();
}

seedSuperAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Seed failed";
  console.error(message);
  process.exit(1);
});
