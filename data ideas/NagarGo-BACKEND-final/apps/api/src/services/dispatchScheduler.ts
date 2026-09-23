import { Order } from "../models/Order";
import { assignNearestRider } from "./matchingService";
import { recordAuditAction } from "./auditService";
import { notify } from "./notificationService";
import { emitToRecipient } from "./socketRegistry";

const POLL_INTERVAL_MS = 15_000;
let timer: ReturnType<typeof setInterval> | null = null;

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

    await notify({
      recipientType: "RIDER",
      recipientId: String(rider._id),
      type: "ORDER_ASSIGNED",
      title: "New delivery assigned",
      body: `Order ${order.publicId} is ready for pickup at ${order.pickup?.fullAddress ?? "the pickup location"}.`,
      relatedType: "Order",
      relatedId: String(order._id),
    });

    emitToRecipient("USER", String(order.customerId), "order:status-changed", {
      orderId: String(order._id),
      status: "RIDER_ASSIGNED",
    });
  }
}

export function startDispatchScheduler() {
  if (timer) return;
  timer = setInterval(() => {
    runDispatchSweep().catch((err) => console.error("[dispatch-scheduler] sweep failed:", err));
  }, POLL_INTERVAL_MS);
}

export function stopDispatchScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
