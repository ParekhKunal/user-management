import { Notification } from "../models/notification.model.js";
import { notFound } from "../utils/app-error.js";

export async function listNotifications(userId: string, unreadOnly = false) {
  const filter: Record<string, unknown> = { recipientId: userId };
  if (unreadOnly) filter.readAt = null;
  const [rows, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ recipientId: userId, readAt: null }),
  ]);
  return {
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      readAt: row.readAt,
      metadata: row.metadata,
      createdAt: row.createdAt,
    })),
    unreadCount,
  };
}

export async function markRead(userId: string, id: string) {
  const row = await Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { readAt: new Date() },
    { new: true }
  );
  if (!row) throw notFound("Notification not found");
  return { id: row.id, readAt: row.readAt };
}

export async function markAllRead(userId: string) {
  const result = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { readAt: new Date() }
  );
  return { updated: result.modifiedCount };
}
