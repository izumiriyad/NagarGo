import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  savedAddresses,
  deleteSavedAddress,
  updateSavedAddress,
  rateOrder,
  disputeOrder,
  disputeByBody,
  myDisputes,
  getDisputeById,
  referral,
  fareEstimate,
  myMedicineOrders,
  getMyMedicineOrder,
  submitContactForm,
} from "../controllers/extraController";
import { generalRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Saved addresses
router.get("/addresses", requireAuth, requireRole("CUSTOMER"), savedAddresses);
router.post("/addresses", requireAuth, requireRole("CUSTOMER"), savedAddresses);
router.put("/addresses/:id", requireAuth, requireRole("CUSTOMER"), updateSavedAddress);
router.delete("/addresses/:id", requireAuth, requireRole("CUSTOMER"), deleteSavedAddress);

// Ratings and disputes
router.post("/orders/:id/rating", requireAuth, requireRole("CUSTOMER"), rateOrder);
router.post("/orders/:id/dispute", requireAuth, requireRole("CUSTOMER"), disputeOrder);
// POST /disputes alias — body must contain { orderId, reason, category }
router.post("/disputes", requireAuth, requireRole("CUSTOMER"), disputeByBody);
router.get("/disputes", requireAuth, requireRole("CUSTOMER"), myDisputes);
router.get("/disputes/:id", requireAuth, requireRole("CUSTOMER"), getDisputeById);

// Referral
router.get("/referral", requireAuth, requireRole("CUSTOMER"), referral);

// Fare estimator — public, no order created
router.get("/pricing/estimate", fareEstimate);
router.post("/pricing/estimate", fareEstimate);

// Customer medicine order views
router.get("/medicine-orders", requireAuth, requireRole("CUSTOMER"), myMedicineOrders);
router.get("/medicine-orders/:id", requireAuth, requireRole("CUSTOMER"), getMyMedicineOrder);

// Public contact form (rate-limited but no auth required)
router.post("/contact", generalRateLimiter, submitContactForm);

export default router;
