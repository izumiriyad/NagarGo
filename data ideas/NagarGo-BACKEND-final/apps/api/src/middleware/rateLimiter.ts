import rateLimit from "express-rate-limit";

/** Generous default for most authenticated API traffic. */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Tight limiter for OTP request/verify endpoints — this is the
 * primary defense against OTP brute-forcing and SMS/notification
 * abuse, independent of the per-OTP attempt limit stored in Mongo.
 */
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many attempts. Please wait a moment and try again." } },
});

/** Stricter still for admin PIN login, given the sensitivity of that account. */
export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password login/signup attempts — looser than admin PIN (customer
 * accounts aren't as sensitive) but still bounded against brute force.
 */
export const passwordAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many attempts. Please wait a moment and try again." } },
});

/**
 * Public, unauthenticated document upload used only during rider
 * onboarding (the applicant has no JWT yet). Tighter than the
 * general limiter to blunt abuse of an endpoint that accepts
 * anonymous file uploads.
 */
export const publicUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many uploads from this device. Please wait and try again." } },
});
