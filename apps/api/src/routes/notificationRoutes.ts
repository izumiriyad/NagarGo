import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController";

const router = Router();
router.get("/", requireAuth, listMyNotifications);
router.post("/:id/read", requireAuth, markNotificationRead);
router.post("/read-all", requireAuth, markAllNotificationsRead);
router.delete("/", requireAuth, clearAllNotifications);
router.delete("/:id", requireAuth, deleteNotification);
export default router;
