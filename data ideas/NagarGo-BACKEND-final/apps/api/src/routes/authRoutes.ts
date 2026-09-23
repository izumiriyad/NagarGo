import { Router } from "express";
import multer from "multer";
import { requestOtp, verifyOtpAndLogin, signup, loginWithPassword } from "../controllers/authController";
import { uploadFile } from "../controllers/uploadController";
import { otpRateLimiter, passwordAuthRateLimiter, publicUploadRateLimiter } from "../middleware/rateLimiter";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const router = Router();

router.post("/request-otp", otpRateLimiter, requestOtp);
router.post("/verify-otp", otpRateLimiter, verifyOtpAndLogin);

router.post("/signup", passwordAuthRateLimiter, signup);
router.post("/login", passwordAuthRateLimiter, loginWithPassword);

// Public — the signup form has no JWT yet. Same shape as the rider
// onboarding upload; reused rate limiter blunts anonymous abuse.
router.post("/signup-upload", publicUploadRateLimiter, upload.single("file"), uploadFile);

export default router;
