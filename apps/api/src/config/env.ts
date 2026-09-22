import "dotenv/config";
import { z } from "zod";

/**
 * Every environment variable the API depends on is declared and
 * validated here. Nothing else in the codebase should read
 * `process.env` directly — that keeps secrets out of business
 * logic and makes missing/misconfigured env vars fail fast, at
 * boot, with a clear error instead of a runtime surprise.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be a long random string"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be a long random string"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  ADMIN_BOOTSTRAP_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  ADMIN_BOOTSTRAP_PIN: z.string().min(4).default("5555"),

  OTP_LENGTH: z.coerce.number().min(4).max(8).default(6),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),

  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_CHAT_ID: z.string().optional().default(""),
  TELEGRAM_LOCATION_UPDATE_INTERVAL_MINUTES: z.coerce.number().default(5),

  GOOGLE_MAPS_API_KEY: z.string().optional().default(""),

  CLOUDINARY_URL: z.string().optional().default(""),
  METRICS_SECRET: z.string().optional().default(""),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),

  ADMIN_BKASH_NUMBER: z.string().default("+8801410348109"),
  ADMIN_BKASH_ACCOUNT_TYPE: z.string().default("Personal"),
  ADMIN_BKASH_INSTRUCTION: z.string().default("Send Money"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail loudly at boot rather than limping along with bad config.
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTelegramConfigured = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
export const isCloudinaryConfigured = Boolean(env.CLOUDINARY_URL);

/**
 * APP_BASE_URL may be a single origin or a comma-separated list
 * (e.g. your Vercel production URL + a preview URL + localhost for
 * testing) — deployments almost always need more than one allowed
 * origin. Used by both Express CORS (app.ts) and Socket.IO CORS
 * (server.ts) so they never drift apart.
 */
export const allowedOrigins = env.APP_BASE_URL.split(",").map((o) => o.trim()).filter(Boolean);
