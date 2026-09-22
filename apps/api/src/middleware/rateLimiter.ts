import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis";

/**
 * Factory: builds a Redis-backed store for express-rate-limit.
 * Falls back silently to the in-memory store if Redis is unavailable
 * (the limiter still works, just won't survive restarts or be shared
 * across multiple API instances in that case).
 */
function makeStore(prefix: string) {
  try {
    return new RedisStore({
      // `sendCommand` is the ioredis low-level call interface
      sendCommand: (...args: string[]) => (redisClient as any).call(...args),
      prefix: `rl:${prefix}:`,
    });
  } catch {
    // Redis not yet connected / not configured — degrade to memory store
    return undefined;
  }
}

/** Generous default for most authenticated API traffic. */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("general"),
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
  store: makeStore("otp"),
});

/** Stricter still for admin PIN login, given the sensitivity of that account. */
export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("admin-login"),
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
  store: makeStore("password-auth"),
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
  store: makeStore("public-upload"),
});
