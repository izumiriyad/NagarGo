import Redis from "ioredis";
import { env } from "./env";

// ---------------------------------------------------------------------------
// Redis client with graceful degradation.
//
// If Redis is unavailable (local dev without Redis installed, network blip,
// etc.) the rest of the API STILL STARTS and serves requests. Features that
// depend on Redis (OTP caching, BullMQ dispatch queue, rate-limiting) will
// fall back to their no-Redis alternatives defined elsewhere.
//
// The process is never crashed by a Redis failure — only logged as a warning.
// ---------------------------------------------------------------------------

function createRedisClient() {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,            // only connect on first use
    // In development: reconnect quickly. In production: use ioredis defaults.
    retryStrategy: (times) => {
      if (env.NODE_ENV === "production") {
        // exponential back-off, cap at 30 s
        return Math.min(Math.pow(2, times) * 200, 30_000);
      }
      // dev: try twice quickly, then give up (don't spam logs for 10 minutes)
      if (times > 2) return null;
      return 500;
    },
  });

  client.on("error", (err) => {
    // Log but never crash
    console.warn("[redis] connection error:", err.message ?? (err as NodeJS.ErrnoException).code);
  });

  client.on("connect", () => {
    console.info("[redis] connected");
  });

  return client;
}

export const redisClient = createRedisClient();

/**
 * Returns true if Redis is currently reachable.
 * Used by health check and feature guards.
 */
export async function isRedisReady(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Convenience wrapper: wraps any Redis operation so that it never throws
 * in a way that crashes a request. Falls back to `fallback` value on error.
 */
export async function withRedis<T>(
  fn: (client: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn(redisClient);
  } catch {
    return fallback;
  }
}
