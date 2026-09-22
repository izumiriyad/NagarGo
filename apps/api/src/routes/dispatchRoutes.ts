import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  dispatchOrder,
  advanceOrder,
  riderRejectAssignment,
} from "../controllers/dispatchController";

const router = Router();

// Admin-only: manually dispatch a specific order to the nearest available rider.
router.post("/orders/:id/dispatch", requireAuth, requireRole("ADMIN"), dispatchOrder);

// Rider: advance the order to the next stage in the state machine.
// E.g., RIDER_ASSIGNED → RIDER_ACCEPTED → RIDER_ARRIVING → RIDER_AT_PICKUP → etc.
router.post("/orders/:id/advance", requireAuth, requireRole("RIDER"), advanceOrder);

// Rider: decline an assignment (only while status === RIDER_ASSIGNED).
router.post("/orders/:id/reject-assignment", requireAuth, requireRole("RIDER"), riderRejectAssignment);

export default router;
