import mongoose, { Schema, type Document, type Model } from "mongoose";
import { LEAVE_TYPE_CODES, type LeaveTypeCode } from "../constants/employment.js";

export interface LeaveTypeDocument extends Document {
  id: string;
  code: LeaveTypeCode;
  name: string;
  defaultDays: number;
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema<LeaveTypeDocument>(
  {
    code: { type: String, enum: LEAVE_TYPE_CODES, required: true, unique: true },
    name: { type: String, required: true },
    defaultDays: { type: Number, required: true, default: 0 },
    paid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LeaveType: Model<LeaveTypeDocument> =
  mongoose.models.LeaveType || mongoose.model<LeaveTypeDocument>("LeaveType", leaveTypeSchema);
