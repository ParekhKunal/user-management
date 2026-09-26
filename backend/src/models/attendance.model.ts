import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "../constants/employment.js";

export interface AttendanceDocument extends Document {
  id: string;
  employeeId: Types.ObjectId;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  totalMinutes: number;
  status: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: Date, required: true },
    clockIn: { type: Date, default: null },
    clockOut: { type: Date, default: null },
    totalMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: "PRESENT" },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance: Model<AttendanceDocument> =
  mongoose.models.Attendance || mongoose.model<AttendanceDocument>("Attendance", attendanceSchema);
