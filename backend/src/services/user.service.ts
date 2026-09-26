import mongoose from "mongoose";
import { User, type UserDocument, type UserRole } from "../models/user.model.js";
import { hashPassword } from "../utils/password.js";
import { resolveStoredRolePermissions } from "./role-permissions.js";
import { conflict, forbidden, notFound } from "../utils/app-error.js";
import { writeAudit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateMeInput,
  UpdateUserInput,
} from "../validators/user.validator.js";

function assertCanManageTarget(actorRole: UserRole, targetRole: UserRole): void {
  if (actorRole === "admin" && targetRole === "super-admin") {
    throw forbidden("Admin cannot manage a Super Admin");
  }
}

function assertCanAssignRole(actorRole: UserRole, nextRole: UserRole): void {
  if (actorRole === "admin" && nextRole === "super-admin") {
    throw forbidden("Admin cannot assign the Super Admin role");
  }
}

async function publicUser(user: UserDocument) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    approvedBy: user.approvedBy,
    approvedAt: user.approvedAt,
    rejectedBy: user.rejectedBy,
    rejectedAt: user.rejectedAt,
    permissions: await resolveStoredRolePermissions(user.role, user.permissions),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function assertLastSuperAdmin(targetId: string, nextRole?: string, nextStatus?: string): Promise<void> {
  const target = await User.findById(targetId);
  if (!target || target.role !== "super-admin") {
    return;
  }
  const remaining = await User.countDocuments({
    role: "super-admin",
    status: "active",
    deletedAt: null,
    _id: { $ne: targetId },
  });
  if (remaining > 0) {
    return;
  }
  if (nextRole && nextRole !== "super-admin") {
    throw forbidden("Cannot remove the final Super Admin");
  }
  if (nextStatus && nextStatus !== "active") {
    throw forbidden("Cannot remove the final Super Admin");
  }
}

async function findActiveRecord(id: string): Promise<UserDocument> {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) {
    throw notFound("User not found");
  }
  return user;
}

export async function createUser(actor: { id: string; role: UserRole }, input: CreateUserInput) {
  assertCanAssignRole(actor.role, input.role);

  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email, deletedAt: null });
  if (existing) {
    throw conflict("Email already exists", "EMAIL_EXISTS");
  }

  const user = await User.create({
    name: input.name,
    email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    status: "active",
    approvedBy: actor.id,
    approvedAt: new Date(),
  });

  return publicUser(user);
}

export async function listUsers(query: ListUsersQuery) {
  const filter: Record<string, unknown> = { deletedAt: null };

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status) {
    filter.status = query.status;
  }

  const skip = (query.page - 1) * query.limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    User.countDocuments(filter),
  ]);

  return {
    users: await Promise.all(users.map(publicUser)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getUserById(id: string) {
  return publicUser(await findActiveRecord(id));
}

export async function getMe(userId: string) {
  return publicUser(await findActiveRecord(userId));
}

export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await findActiveRecord(userId);
  user.name = input.name;
  await user.save();
  return publicUser(user);
}

export async function updateUser(
  actor: { id: string; role: UserRole },
  targetId: string,
  input: UpdateUserInput
) {
  const user = await findActiveRecord(targetId);
  assertCanManageTarget(actor.role, user.role);
  await assertLastSuperAdmin(targetId, input.role, input.status);

  if (input.role) {
    assertCanAssignRole(actor.role, input.role);
  }

  if (input.email) {
    const email = input.email.toLowerCase();
    const existing = await User.findOne({
      email,
      deletedAt: null,
      _id: { $ne: user._id },
    });
    if (existing) {
      throw conflict("Email already exists", "EMAIL_EXISTS");
    }
    user.email = email;
  }

  if (input.name) {
    user.name = input.name;
  }

  if (input.role) {
    user.role = input.role;
  }

  if (input.status) {
    user.status = input.status;
  }

  await user.save();
  return publicUser(user);
}

export async function deleteUser(actor: { id: string; role: UserRole }, targetId: string) {
  if (actor.id === targetId) {
    throw forbidden("You cannot delete your own account");
  }

  const user = await findActiveRecord(targetId);
  assertCanManageTarget(actor.role, user.role);
  await assertLastSuperAdmin(targetId, "user", "inactive");

  user.deletedAt = new Date();
  user.status = "inactive";
  await user.save();
}

export async function listPendingUsers() {
  const users = await User.find({ status: "pending", deletedAt: null }).sort({ createdAt: -1 });
  return Promise.all(users.map(publicUser));
}

export async function approveUser(actor: { id: string; role: UserRole }, targetId: string) {
  const user = await findActiveRecord(targetId);

  if (user.status !== "pending") {
    throw forbidden("Only pending registrations can be approved");
  }

  user.status = "active";
  user.approvedBy = new mongoose.Types.ObjectId(actor.id);
  user.approvedAt = new Date();
  user.rejectedBy = null;
  user.rejectedAt = null;
  await user.save();
  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_APPROVED",
    resourceType: "user",
    resourceId: user.id,
  });
  await notify({
    recipientId: user.id,
    type: "ACCOUNT_APPROVED",
    title: "Account approved",
    message: "Your registration was approved. You can now sign in.",
  });

  return publicUser(user);
}

export async function rejectUser(actor: { id: string; role: UserRole }, targetId: string) {
  const user = await findActiveRecord(targetId);

  if (user.status !== "pending") {
    throw forbidden("Only pending registrations can be rejected");
  }

  user.status = "rejected";
  user.rejectedBy = new mongoose.Types.ObjectId(actor.id);
  user.rejectedAt = new Date();
  await user.save();
  await writeAudit({
    actorId: actor.id,
    action: "EMPLOYEE_REJECTED",
    resourceType: "user",
    resourceId: user.id,
  });

  return publicUser(user);
}

export async function getDashboardStats() {
  const [totalUsers, pendingApprovals, activeUsers, inactiveUsers, adminCount, recentRegistrations] =
    await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, status: "pending" }),
      User.countDocuments({ deletedAt: null, status: "active" }),
      User.countDocuments({ deletedAt: null, status: "inactive" }),
      User.countDocuments({ deletedAt: null, role: { $in: ["admin", "super-admin"] } }),
      User.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(8),
    ]);

  return {
    totalUsers,
    pendingApprovals,
    activeUsers,
    inactiveUsers,
    adminCount,
    recentRegistrations: await Promise.all(recentRegistrations.map(publicUser)),
  };
}
