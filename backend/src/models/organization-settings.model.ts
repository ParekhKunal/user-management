import mongoose, { Schema, type Document, type Model } from "mongoose";
import { WORK_MODES, type WorkMode } from "../constants/employment.js";

export interface OrganizationSettingsDocument extends Document {
  organizationName: string;
  organizationCode: string;
  timezone: string;
  country: string;
  defaultWorkMode: WorkMode;
  workingDays: number[];
  defaultLeavePolicy: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<OrganizationSettingsDocument>(
  {
    organizationName: { type: String, required: true, default: "KP Technologies" },
    organizationCode: { type: String, required: true, default: "KP" },
    timezone: { type: String, default: "Asia/Kolkata" },
    country: { type: String, default: "IN" },
    defaultWorkMode: { type: String, enum: WORK_MODES, default: "HYBRID" },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    defaultLeavePolicy: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const OrganizationSettings: Model<OrganizationSettingsDocument> =
  mongoose.models.OrganizationSettings ||
  mongoose.model<OrganizationSettingsDocument>(
    "OrganizationSettings",
    settingsSchema,
    "organization_settings"
  );
