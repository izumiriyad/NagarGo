import { Router } from "express";
import { getPaymentConfig, selectPaymentMethod, submitTransaction } from "../controllers/paymentController";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/config", getPaymentConfig); // public: customers need this before checkout
router.post("/", requireAuth, requireRole("CUSTOMER"), selectPaymentMethod);
router.post("/:id/submit-transaction", requireAuth, requireRole("CUSTOMER"), submitTransaction);

export default router;
