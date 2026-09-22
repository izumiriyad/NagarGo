import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  savedAddresses,
  deleteSavedAddress,
  updateSavedAddress,
  rateOrder,
  disputeOrder,
  myDisputes,
  referral,
  fareEstimate,
  myMedicineOrders,
  getMyMedicineOrder,
} from "../controllers/extraController";

const router = Router();

// Saved addresses
router.get("/addresses", requireAuth, requireRole("CUSTOMER"), savedAddresses);
router.post("/addresses", requireAuth, requireRole("CUSTOMER"), savedAddresses);
router.put("/addresses/:id", requireAuth, requireRole("CUSTOMER"), updateSavedAddress);
router.delete("/addresses/:id", requireAuth, requireRole("CUSTOMER"), deleteSavedAddress);

// Ratings and disputes
router.post("/orders/:id/rating", requireAuth, requireRole("CUSTOMER"), rateOrder);
router.post("/orders/:id/dispute", requireAuth, requireRole("CUSTOMER"), disputeOrder);
router.get("/disputes", requireAuth, requireRole("CUSTOMER"), myDisputes);

// Referral
router.get("/referral", requireAuth, requireRole("CUSTOMER"), referral);

// Fare estimator — public, no order created
router.get("/pricing/estimate", fareEstimate);
router.post("/pricing/estimate", fareEstimate);

// Customer medicine order views
router.get("/medicine-orders", requireAuth, requireRole("CUSTOMER"), myMedicineOrders);
router.get("/medicine-orders/:id", requireAuth, requireRole("CUSTOMER"), getMyMedicineOrder);

export default router;
