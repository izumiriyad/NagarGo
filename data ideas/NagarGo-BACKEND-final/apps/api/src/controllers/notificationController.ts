import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { AppError } from "../middleware/errorHandler";

function recipientTypeForRole(role: string): "USER" | "RIDER" | "ADMIN" {
  if (role === "CUSTOMER") return "USER";
  if (role === "RIDER") return "RIDER";
  return "ADMIN";
}

export async function listMyNotifications(req: Request, res: Response) {
  const recipientType = recipientTypeForRole(req.auth!.role);
  const notifications = await Notification.find({ recipientType, recipientId: req.auth!.sub })
    .sort({ createdAt: -1 })
    .limit(100);
  const unreadCount = await Notification.countDocuments({ recipientType, recipientId: req.auth!.sub, readAt: { $exists: false } });
  res.json({ notifications, unreadCount });
}

export async function markNotificationRead(req: Request, res: Response) {
  const recipientType = recipientTypeForRole(req.auth!.role);
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientType, recipientId: req.auth!.sub },
    { readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new AppError("Notification not found.", 404);
  res.json({ notification });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const recipientType = recipientTypeForRole(req.auth!.role);
  await Notification.updateMany({ recipientType, recipientId: req.auth!.sub, readAt: { $exists: false } }, { readAt: new Date() });
  res.json({ message: "All notifications marked read." });
}
