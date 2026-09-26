import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  WORK_MODES,
  type EmploymentStatus,
  type EmploymentType,
  type Gender,
  type WorkMode,
} from "../constants/employment.js";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeDocument extends Document {
  id: string;
  userId: Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string;
  dateOfBirth: Date | null;
  gender: Gender;
  joiningDate: Date | null;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  jobTitle: string;
  departmentId: Types.ObjectId | null;
  teamId: Types.ObjectId | null;
  managerId: Types.ObjectId | null;
  location: string;
  workMode: WorkMode;
  address: Address;
  emergencyContact: EmergencyContact;
  leaveBalances: Record<string, number>;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<Address>(
  {
    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" },
  },
  { _id: false }
);

const emergencySchema = new Schema<EmergencyContact>(
  {
    name: { type: String, default: "" },
    relationship: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const employeeSchema = new Schema<EmployeeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeCode: { type: String, required: true, unique: true, immutable: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    profileImage: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: GENDERS, default: "UNSPECIFIED" },
    joiningDate: { type: Date, default: null },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: "FULL_TIME" },
    employmentStatus: { type: String, enum: EMPLOYMENT_STATUSES, default: "ONBOARDING" },
    jobTitle: { type: String, default: "", trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    managerId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    location: { type: String, default: "", trim: true },
    workMode: { type: String, enum: WORK_MODES, default: "HYBRID" },
    address: { type: addressSchema, default: () => ({}) },
    emergencyContact: { type: emergencySchema, default: () => ({}) },
    leaveBalances: { type: Schema.Types.Mixed, default: () => ({}) },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const row = ret as Record<string, unknown>;
        row.id = String(row._id);
        delete row._id;
        delete row.__v;
        return row;
      },
    },
  }
);

employeeSchema.index({ email: 1 });
employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ teamId: 1 });
employeeSchema.index({ managerId: 1 });
employeeSchema.index({ employmentStatus: 1 });
employeeSchema.index({ joiningDate: 1 });
employeeSchema.index({ deletedAt: 1 });
employeeSchema.index({ firstName: 1, lastName: 1 });

export const Employee: Model<EmployeeDocument> =
  mongoose.models.Employee || mongoose.model<EmployeeDocument>("Employee", employeeSchema);
