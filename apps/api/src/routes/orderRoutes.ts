import { Router } from "express";
import {
  createOrder,
  listMyOrders,
  getOrder,
  cancelOrder,
  requestDeliveryOtp,
  verifyDeliveryOtp,
  getOrderReceipt,
} from "../controllers/orderController";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requireRole("CUSTOMER"), listMyOrders);
router.post("/", requireAuth, requireRole("CUSTOMER"), createOrder);
router.get("/:id", requireAuth, requireRole("CUSTOMER", "RIDER", "ADMIN"), getOrder);
router.post("/:id/cancel", requireAuth, requireRole("CUSTOMER", "RIDER", "ADMIN"), cancelOrder);

// stage = "pickup" | "delivery"
router.post("/:id/otp/:stage/request", requireAuth, requireRole("CUSTOMER"), requestDeliveryOtp);
router.post("/:id/otp/:stage/verify", requireAuth, requireRole("RIDER"), verifyDeliveryOtp);

// Receipt — only for DELIVERED orders
router.get("/:id/receipt", requireAuth, requireRole("CUSTOMER", "ADMIN"), getOrderReceipt);

export default router;
