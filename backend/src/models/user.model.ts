import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { SYSTEM_ROLES, type SystemRole } from "../constants/permissions.js";

export const USER_ROLES = SYSTEM_ROLES;
export type UserRole = SystemRole;

export const USER_STATUSES = ["pending", "active", "rejected", "inactive", "locked"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserDocument extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;
  rejectedBy: Types.ObjectId | null;
  rejectedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "user",
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      required: true,
      default: "pending",
    },
    permissions: { type: [String], default: [] },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const user = ret as Record<string, unknown>;
        user.id = String(user._id);
        delete user._id;
        delete user.__v;
        delete user.passwordHash;
        return user;
      },
    },
  }
);

userSchema.index({ role: 1, status: 1 });

export const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
