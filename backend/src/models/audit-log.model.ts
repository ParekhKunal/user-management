import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface AuditLogDocument extends Document {
  id: string;
  actorId: Types.ObjectId | null;
  action: string;
  resourceType: string;
  resourceId: Types.ObjectId | string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: Schema.Types.Mixed, default: null, index: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<AuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema, "audit_logs");
