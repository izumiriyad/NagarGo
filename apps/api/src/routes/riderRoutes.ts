import { Router } from "express";
import multer from "multer";
import {
  registerRider,
  riderProfile,
  riderOrders,
  updateRiderOnline,
  updateRiderLocation,
  connectTelegram,
  updateRiderProfile,
  riderEarnings,
} from "../controllers/riderController";
import { uploadFile } from "../controllers/uploadController";
import { requireAuth, requireRole } from "../middleware/auth";
import { publicUploadRateLimiter } from "../middleware/rateLimiter";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

// Public: no auth required at registration time.
router.post("/register", registerRider);
router.post("/onboarding-upload", publicUploadRateLimiter, upload.single("file"), uploadFile);

// Authenticated rider routes
router.get("/me", requireAuth, requireRole("RIDER"), riderProfile);
router.patch("/me", requireAuth, requireRole("RIDER"), updateRiderProfile);
router.get("/me/earnings", requireAuth, requireRole("RIDER"), riderEarnings);
router.get("/orders", requireAuth, requireRole("RIDER"), riderOrders);
router.post("/online", requireAuth, requireRole("RIDER"), updateRiderOnline);
router.post("/location", requireAuth, requireRole("RIDER"), updateRiderLocation);
router.get("/telegram/connect", requireAuth, requireRole("RIDER"), connectTelegram);

export default router;
