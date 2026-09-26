import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { ENTITY_STATUSES, type EntityStatus } from "../constants/employment.js";

export interface DepartmentDocument extends Document {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId: Types.ObjectId | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<DepartmentDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    status: { type: String, enum: ENTITY_STATUSES, default: "ACTIVE" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

departmentSchema.index({ name: 1 });
departmentSchema.index({ status: 1 });

export const Department: Model<DepartmentDocument> =
  mongoose.models.Department || mongoose.model<DepartmentDocument>("Department", departmentSchema);
