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
};

export const dispatchQueue = new Queue("dispatchQueue", { connection: redisConnection });

export const dispatchWorker = new Worker("dispatchQueue", async (job) => {
  if (job.name === "sweep") {
    await runDispatchSweep();
  }
}, { connection: redisConnection });

dispatchWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "[bullmq] dispatchWorker job failed");
});

export async function startDispatchScheduler() {
  // Use a repeatable job so it only executes exactly once per interval
  // across the entire distributed cluster.
  await dispatchQueue.upsertJobScheduler(
    "global-dispatch-sweep",
    {
      every: 15000,
    },
    {
      name: "sweep",
      data: {}
    }
  );
  logger.info("[bullmq] Distributed dispatch scheduler started");
}

export async function stopDispatchScheduler() {
  await dispatchWorker.close();
  await dispatchQueue.close();
}
