import { Router } from "express";
import { adminLogin, changeAdminPin, logoutAllAdminSessions } from "../controllers/adminAuthController";
import { verifyPayment } from "../controllers/paymentController";
import { requireAuth, requireRole } from "../middleware/auth";
import { adminLoginRateLimiter } from "../middleware/rateLimiter";
import { telegramService } from "../services/telegramService";
import {
  dashboard,
  listRiders,
  reviewRider,
  listOrders,
  listPayments,
  pricing,
  paymentConfig,
  listUsers,
  setUserStatus,
  auditLogs,
  content,
  flags,
  listDisputes,
  resolveDispute,
  analytics,
  activeRiders,
  riderEarningsAdmin,
} from "../controllers/adminController";
import { listMedicineOrders, reviewMedicine } from "../controllers/medicineController";

const router = Router();
const admin = [requireAuth, requireRole("ADMIN")] as const;

// Admin auth
router.post("/auth/login", adminLoginRateLimiter, adminLogin);
router.post("/auth/change-pin", ...admin, changeAdminPin);
router.post("/auth/logout-all", ...admin, logoutAllAdminSessions);

// Dashboard & analytics
router.get("/dashboard", ...admin, dashboard);
router.get("/analytics", ...admin, analytics);

// Rider management
router.get("/riders", ...admin, listRiders);
router.get("/riders/active", ...admin, activeRiders);
router.post("/riders/:id/review", ...admin, reviewRider);
router.get("/riders/:id/earnings", ...admin, riderEarningsAdmin);

// Order management (paginated)
router.get("/orders", ...admin, listOrders);

// Payment management
router.get("/payments", ...admin, listPayments);
router.post("/payments/:id/verify", ...admin, verifyPayment);

// User management
router.get("/users", ...admin, listUsers);
router.post("/users/:id/status", ...admin, setUserStatus);

// Audit logs
router.get("/audit-logs", ...admin, auditLogs);

// Config management
router.get("/pricing", ...admin, pricing);
router.put("/pricing", ...admin, pricing);
router.put("/payment-config", ...admin, paymentConfig);
router.get("/content", ...admin, content);
router.put("/content", ...admin, content);
router.get("/flags", ...admin, flags);
router.put("/flags", ...admin, flags);

// Medicine orders
router.get("/medicine-orders", ...admin, listMedicineOrders);
router.post("/medicine-orders/:id/review", ...admin, reviewMedicine);

// Disputes
router.get("/disputes", ...admin, listDisputes);
router.post("/disputes/:id/resolve", ...admin, resolveDispute);

// Telegram test
router.post("/telegram/test", ...admin, async (_req, res) => {
  const result = await telegramService.sendTestMessage();
  res.status(result.ok ? 200 : 400).json(result);
});

export default router;
