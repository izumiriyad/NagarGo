import { Notification, NotificationDocument } from "../models/Notification";
import { emitToRecipient } from "./socketRegistry";

type RecipientType = "USER" | "RIDER" | "ADMIN";

interface NotifyInput {
  recipientType: RecipientType;
  recipientId: string;
  type: NotificationDocument["type"];
  title: string;
  body: string;
  relatedType?: NotificationDocument["relatedType"];
  relatedId?: string;
}

/**
 * Single entry point for creating a notification. Persists it (so it
 * shows up in a bell/inbox even if the recipient is offline) and, if
 * they're connected, pushes it instantly over Socket.IO.
 *
 * PRODUCTION TODO (Phase 4): also fan this out to a push-notification
 * provider (FCM/APNs) once mobile clients exist — this function is
 * the single place to add that call.
 */
export async function notify(input: NotifyInput) {
  const doc = await Notification.create({
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    body: input.body,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
  });
  emitToRecipient(input.recipientType, input.recipientId, "notification:new", doc);
  return doc;
}
