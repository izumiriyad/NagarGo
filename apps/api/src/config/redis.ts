import Redis from "ioredis";
import { env } from "./env";

/**
 * Shared ioredis client. BullMQ creates its own internal connections
 * but this client is used by the health check and can be reused by
 * any other service that needs a raw Redis ping or simple key ops.
 *
 * The connection is lazy — it only actually connects on first use.
 */
export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null, // required by BullMQ, harmless for general use
  enableReadyCheck: false,
  lazyConnect: true,
});

redisClient.on("error", (err) => {
  // Log but never crash — Redis being down should degrade gracefully,
  // not take the whole API with it.
  console.warn("[redis] connection error:", err.message);
});
