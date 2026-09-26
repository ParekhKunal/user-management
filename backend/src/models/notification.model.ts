import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface NotificationDocument extends Document {
  id: string;
  recipientId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", notificationSchema);
