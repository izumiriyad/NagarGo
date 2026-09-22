import { Request, Response } from "express";
import { z } from "zod";
import { Order, OrderState } from "../models/Order";
import { Rider } from "../models/Rider";
import { AppError } from "../middleware/errorHandler";
import { applyTransition } from "./orderController";
import { assignNearestRider } from "../services/matchingService";
import { recordAuditAction } from "../services/auditService";
import { notify } from "../services/notificationService";
import { emitToRecipient } from "../services/socketRegistry";
import { telegramService } from "../services/telegramService";

const riderNext: Record<string, OrderState> = {
  RIDER_ASSIGNED: "RIDER_ACCEPTED",
  RIDER_ACCEPTED: "RIDER_ARRIVING",
  RIDER_ARRIVING: "RIDER_AT_PICKUP",
  RIDER_AT_PICKUP: "PICKUP_OTP_PENDING",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "RIDER_AT_DESTINATION",
  RIDER_AT_DESTINATION: "DELIVERY_OTP_PENDING",
};

/** Admin: manually dispatch a specific order to the nearest available rider. */
export async function dispatchOrder(req: Request, res: Response) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.status !== "SEARCHING_RIDER") {
    throw new AppError("Order is not searching for a rider.", 409);
  }

  const rider = await assignNearestRider(String(order._id));
  if (!rider) throw new AppError("No eligible rider is currently online.", 409);

  await telegramService.sendRiderOrder(String(rider._id), order);

  await recordAuditAction({
    actorType: "ADMIN",
    actorId: req.auth!.sub,
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
    body: `Order ${order.publicId} is ready for pickup at ${order.pickup?.fullAddress ?? "your location"}.`,
    relatedType: "Order",
    relatedId: String(order._id),
  });

  emitToRecipient("USER", String(order.customerId), "order:status-changed", {
    orderId: String(order._id),
    status: "RIDER_ASSIGNED",
  });

  res.json({ order: await Order.findById(order._id), rider });
}

/** Rider: advance the order to the next stage in the state machine. */
export async function advanceOrder(req: Request, res: Response) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found.", 404);
  if (String(order.riderId) !== req.auth!.sub) throw new AppError("Not found.", 404);

  const next = riderNext[order.status];
  if (!next) {
    throw new AppError("This order is waiting for an OTP/payment/admin action.", 409);
  }

  applyTransition(order.status as OrderState, next);
  order.status = next;
  order.statusHistory.push({ status: next });
  await order.save();

  // Notify customer of every state advance (persists to notification bell + socket push).
  const statusLabel = (next as string).replaceAll("_", " ").toLowerCase();
  await notify({
    recipientType: "USER",
    recipientId: String(order.customerId),
    type: "ORDER_STATUS_CHANGED",
    title: "Order update",
    body: `Your order ${order.publicId} is now: ${statusLabel}.`,
    relatedType: "Order",
    relatedId: String(order._id),
  });

  // Emit directly to the order room (both customer app and rider map can subscribe).
  emitToRecipient("USER", String(order.customerId), "order:status-changed", {
    orderId: String(order._id),
    status: next,
  });

  // Broadcast to admin live dashboard.
  const { broadcastToAdmins } = await import("../services/socketRegistry");
  broadcastToAdmins("order:status-changed", {
    orderId: String(order._id),
    publicId: order.publicId,
    status: next,
    riderId: String(order.riderId),
  });

  // When an order is fully delivered, credit the rider's stats.
  if (next === "IN_TRANSIT") {
    // DELIVERED is triggered later by OTP verification, not here —
    // completedDeliveries is incremented in orderController.confirmDeliveryOtp
  }

  res.json({ order });
}

/** Rider: decline an assignment while it's still in RIDER_ASSIGNED state. */
export async function riderRejectAssignment(req: Request, res: Response) {
  const body = z.object({ reason: z.string().optional() }).parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order || String(order.riderId) !== req.auth!.sub) {
    throw new AppError("Not found.", 404);
  }
  if (order.status !== "RIDER_ASSIGNED") {
    throw new AppError("Assignment cannot be rejected now.", 409);
  }

  // Mark this dispatch attempt as rejected so the scheduler can skip this rider.
  const attempt = order.dispatchAttempts?.find(
    (a: any) => String(a.riderId) === String(req.auth!.sub) && a.outcome === "PENDING"
  );
  if (attempt) attempt.outcome = "REJECTED";

  order.riderId = undefined;
  applyTransition(order.status as OrderState, "SEARCHING_RIDER");
  order.status = "SEARCHING_RIDER";
  order.statusHistory.push({
    status: "SEARCHING_RIDER",
    note: body.reason ?? "Rider declined assignment.",
  });
  await order.save();

  // Increment cancellation count on the rider's profile.
  const rider = await Rider.findById(req.auth!.sub);
  if (rider) {
    rider.cancellationCount += 1;
    await rider.save();
  }

  res.json({ order });
}
