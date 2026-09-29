import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

let isConnected = false;
let isConnecting = false;

const MAX_RETRIES = env.NODE_ENV === "production" ? Infinity : 5;
const RETRY_DELAY_MS = 5_000; // 5 seconds between retries

/**
 * Returns true if Mongoose currently has an open connection.
 * Use in middleware/health-check to 503 instead of crashing when DB is down.
 */
export function isDbConnected(): boolean {
  return isConnected;
}

/**
 * Attempt connection once with a single timeout.
 * Returns true on success, false on failure.
 */
async function tryConnect(): Promise<boolean> {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8_000, // give up per-attempt after 8 s
      socketTimeoutMS: 45_000,
    });
    isConnected = true;
    logger.info("[db] connected to MongoDB");
    return true;
  } catch (err: any) {
    logger.warn("[db] connection attempt failed: " + (err?.message ?? err));
    return false;
  }
}

/**
 * Connects to MongoDB with automatic retry.
 *
 * In development (NODE_ENV !== "production"):
 *   - Tries up to MAX_RETRIES times, then gives up so the dev server
 *     still starts and serves routes that don't need the DB.
 *
 * In production:
 *   - Retries indefinitely (container orchestration will restart if truly broken).
 *
 * NEVER throws — the caller can check isDbConnected() to know the current state.
 */
export async function connectDB(): Promise<void> {
  if (isConnected || isConnecting) return;
  isConnecting = true;

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    logger.info(`[db] connecting (attempt ${attempt}/${MAX_RETRIES === Infinity ? "∞" : MAX_RETRIES})…`);
    const ok = await tryConnect();
    if (ok) {
      isConnecting = false;
      // Re-attach reconnection listener
      mongoose.connection.on("disconnected", () => {
        isConnected = false;
        logger.warn("[db] disconnected — will retry…");
        connectDB(); // background retry
      });
      return;
    }
    if (attempt < MAX_RETRIES) {
      logger.warn(`[db] retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  isConnecting = false;
  logger.error("[db] could not connect to MongoDB after max retries. API running in degraded mode.");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}
