import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface InvitationDocument extends Document {
  id: string;
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<InvitationDocument>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

invitationSchema.index({ userId: 1, acceptedAt: 1 });
invitationSchema.index({ expiresAt: 1 });

export const Invitation: Model<InvitationDocument> =
  mongoose.models.Invitation || mongoose.model<InvitationDocument>("Invitation", invitationSchema);
