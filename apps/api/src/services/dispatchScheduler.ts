import { Order } from "../models/Order";
import { assignNearestRider } from "./matchingService";
import { recordAuditAction } from "./auditService";
import { notify } from "./notificationService";
import { emitToRecipient } from "./socketRegistry";
import { telegramService } from "./telegramService";

// Removed timer variable
/**
 * Runs assignNearestRider() for every order still waiting in
 * SEARCHING_RIDER, so a customer isn't stuck forever if no rider was
 * online at order-confirmation time. This is the "order dispatch
 * system" scheduler: admins can still force-assign via
 * POST /orders/:id/dispatch (dispatchController.dispatchOrder) for a
 * specific order, but most orders should clear through here
 * automatically as riders come online.
 *
 * PRODUCTION TODO (Phase 4/5): replace the in-process setInterval
 * with a real background job queue (BullMQ/SQS) once running more
 * than one API instance, so dispatch attempts aren't duplicated
 * across processes.
 */
export async function runDispatchSweep() {
  const assigned = await Order.find({ status: "RIDER_ASSIGNED" }).limit(50);
  for (const order of assigned) {
    const last = order.statusHistory.filter((h: any) => h.status === "RIDER_ASSIGNED").at(-1);
    if (last && Date.now() - new Date(last.at).getTime() >= 60_000) {
      const attempt = order.dispatchAttempts?.find((a:any) => String(a.riderId) === String(order.riderId) && a.outcome === "PENDING");
      if (attempt) attempt.outcome = "TIMEOUT";
      order.riderId = undefined; order.status = "SEARCHING_RIDER"; order.statusHistory.push({ status: "SEARCHING_RIDER", note: "Rider offer timed out after 60 seconds." }); await order.save();
    }
  }

  const waiting = await Order.find({ status: "SEARCHING_RIDER" }).limit(50);
  for (const order of waiting) {
    const rider = await assignNearestRider(String(order._id));
    if (!rider) continue;

    await recordAuditAction({
      actorType: "SYSTEM",
      action: "RIDER_AUTO_ASSIGNED",
      targetType: "Order",
      targetId: String(order._id),
      after: { riderId: String(rider._id) },
    });

    await telegramService.sendRiderOrder(String(rider._id), order);

    await notify({
      recipientType: "RIDER",
      recipientId: String(rider._id),
      type: "ORDER_ASSIGNED",
      title: "New delivery assigned",
      body: `Order ${order.publicId} is ready for pickup at ${order.pickup?.fullAddress ?? "your location"}.`,
      relatedType: "Order",
      relatedId: String(order._id),
    });

    // Notify the customer that a rider has been found
    await notify({
      recipientType: "USER",
      recipientId: String(order.customerId),
      type: "ORDER_STATUS_CHANGED",
      title: "Rider assigned \uD83D\uDEB4",
      body: `A rider has been assigned to your order ${order.publicId} and is on their way.`,
      relatedType: "Order",
      relatedId: String(order._id),
    });

    emitToRecipient("USER", String(order.customerId), "order:status-changed", {
      orderId: String(order._id),
      status: "RIDER_ASSIGNED",
    });
  }
}

import { Queue, Worker } from "bullmq";
import { logger } from "../config/logger";
import { env } from "../config/env";

const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Give up quickly in dev so BullMQ failure doesn't block startup
  retryStrategy: (times: number) => {
    if (env.NODE_ENV !== "production" && times > 2) return null;
    return Math.min(times * 200, 5000);
  },
};

export let dispatchQueue: Queue | null = null;
let dispatchWorker: Worker | null = null;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;

export async function startDispatchScheduler() {
  try {
    dispatchQueue = new Queue("dispatchQueue", { connection: redisConnection });
    dispatchWorker = new Worker(
      "dispatchQueue",
      async (job) => {
        if (job.name === "sweep") await runDispatchSweep();
      },
      { connection: redisConnection }
    );

    dispatchWorker.on("failed", (job, err) => {
      logger.error({ err, jobId: job?.id }, "[bullmq] dispatchWorker job failed");
    });

    await dispatchQueue.upsertJobScheduler(
      "global-dispatch-sweep",
      { every: 15_000 },
      { name: "sweep", data: {} }
    );
    logger.info("[dispatch] BullMQ distributed scheduler started (Redis connected)");
  } catch (err: any) {
    // Redis not available — fall back to a simple in-process timer.
    // This is fine for single-instance deployments and local dev.
    logger.warn("[dispatch] Redis unavailable, falling back to in-process setInterval: " + (err?.message ?? err));
    fallbackTimer = setInterval(() => {
      runDispatchSweep().catch((e) =>
        logger.error({ err: e }, "[dispatch] sweep error (fallback)")
      );
    }, 15_000);
  }
}

export async function stopDispatchScheduler() {
  if (fallbackTimer) {
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }
  try {
    await dispatchWorker?.close();
    await dispatchQueue?.close();
  } catch {
    // ignore cleanup errors
  }
}

