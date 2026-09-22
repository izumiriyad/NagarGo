import { Router } from "express";
import multer from "multer";
import {
  requestOtp,
  verifyOtpAndLogin,
  signup,
  loginWithPassword,
  getMe,
  updateMe,
  refreshToken,
  logout,
  deleteAccount,
} from "../controllers/authController";
import { uploadFile } from "../controllers/uploadController";
import {
  otpRateLimiter,
  passwordAuthRateLimiter,
  publicUploadRateLimiter,
} from "../middleware/rateLimiter";
import { requireAuth, requireRole } from "../middleware/auth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const router = Router();

router.post("/request-otp", otpRateLimiter, requestOtp);
router.post("/verify-otp", otpRateLimiter, verifyOtpAndLogin);

router.post("/signup", passwordAuthRateLimiter, signup);
router.post("/login", passwordAuthRateLimiter, loginWithPassword);

// Token lifecycle
router.post("/refresh", refreshToken);
router.post("/logout", requireAuth, logout);

// Public — the signup form has no JWT yet.
router.post("/signup-upload", publicUploadRateLimiter, upload.single("file"), uploadFile);

// Authenticated customer profile
router.get("/me", requireAuth, requireRole("CUSTOMER"), getMe);
router.patch("/me", requireAuth, requireRole("CUSTOMER"), updateMe);

// Account deletion (GDPR soft-delete)
router.delete("/account", requireAuth, requireRole("CUSTOMER"), deleteAccount);

export default router;
