import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { LEAVE_STATUSES, type LeaveStatus } from "../constants/employment.js";

export interface LeaveDocument extends Document {
  id: string;
  employeeId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  reviewComment: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<LeaveDocument>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveTypeId: { type: Schema.Types.ObjectId, ref: "LeaveType", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },
    reason: { type: String, default: "", trim: true },
    status: { type: String, enum: LEAVE_STATUSES, default: "PENDING", index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewComment: { type: String, default: "" },
  },
  { timestamps: true }
);

leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ employeeId: 1, status: 1 });

export const Leave: Model<LeaveDocument> =
  mongoose.models.Leave || mongoose.model<LeaveDocument>("Leave", leaveSchema);
