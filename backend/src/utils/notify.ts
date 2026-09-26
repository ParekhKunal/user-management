import { Notification } from "../models/notification.model.js";

export async function notify(input: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await Notification.create({
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export async function notifyMany(
  recipientIds: string[],
  payload: Omit<Parameters<typeof notify>[0], "recipientId">
): Promise<void> {
  if (recipientIds.length === 0) {
    return;
  }
  await Notification.insertMany(
    recipientIds.map((recipientId) => ({
      recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata ?? {},
    }))
  );
}
