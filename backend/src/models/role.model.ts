import mongoose, { Schema, type Document, type Model } from "mongoose";
import { PERMISSIONS, type Permission } from "../constants/permissions.js";

export interface RoleDocument extends Document {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<RoleDocument>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    permissions: { type: [String], enum: PERMISSIONS, default: [] },
    system: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role: Model<RoleDocument> =
  mongoose.models.Role || mongoose.model<RoleDocument>("Role", roleSchema);
