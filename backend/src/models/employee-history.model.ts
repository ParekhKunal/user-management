import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface EmployeeHistoryDocument extends Document {
  id: string;
  employeeId: Types.ObjectId;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  performedBy: Types.ObjectId | null;
  reason: string;
  createdAt: Date;
}

const employeeHistorySchema = new Schema<EmployeeHistoryDocument>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    action: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reason: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const EmployeeHistory: Model<EmployeeHistoryDocument> =
  mongoose.models.EmployeeHistory ||
  mongoose.model<EmployeeHistoryDocument>(
    "EmployeeHistory",
    employeeHistorySchema,
    "employee_history"
  );
