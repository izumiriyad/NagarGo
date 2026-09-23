import { Router } from "express";
import {
  createOrder,
  getOrder,
  cancelOrder,
  requestDeliveryOtp,
  verifyDeliveryOtp,
} from "../controllers/orderController";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, requireRole("CUSTOMER"), createOrder);
router.get("/:id", requireAuth, requireRole("CUSTOMER", "RIDER", "ADMIN"), getOrder);
router.post("/:id/cancel", requireAuth, requireRole("CUSTOMER", "RIDER", "ADMIN"), cancelOrder);

// stage = "pickup" | "delivery"
router.post("/:id/otp/:stage/request", requireAuth, requireRole("CUSTOMER"), requestDeliveryOtp);
router.post("/:id/otp/:stage/verify", requireAuth, requireRole("RIDER"), verifyDeliveryOtp);

export default router;
