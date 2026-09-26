import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { ENTITY_STATUSES, type EntityStatus } from "../constants/employment.js";

export interface TeamDocument extends Document {
  id: string;
  name: string;
  code: string;
  departmentId: Types.ObjectId;
  managerId: Types.ObjectId | null;
  description: string;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<TeamDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    managerId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: ENTITY_STATUSES, default: "ACTIVE" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

teamSchema.index({ departmentId: 1, code: 1 }, { unique: true });
teamSchema.index({ status: 1 });

export const Team: Model<TeamDocument> =
  mongoose.models.Team || mongoose.model<TeamDocument>("Team", teamSchema);
