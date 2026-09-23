import { Request, Response } from "express";
import { z } from "zod";
import { Order, ORDER_TRANSITIONS, OrderState } from "../models/Order";
import { calculatePricing } from "../services/pricingService";
import { calculateRoadDistanceKm } from "../services/mapService";
import { issueOtp, verifyOtp } from "../services/otpService";
import { AppError } from "../middleware/errorHandler";
import { assertOwnsResource } from "../middleware/auth";
import { telegramService } from "../services/telegramService";
import { User } from "../models/User";

/**
 * Moves an order to a new state only if the transition is legal.
 * This is the single choke point for order status changes — no
 * controller should ever do `order.status = X; order.save()`
 * directly.
 */
export function applyTransition(currentStatus: OrderState, nextStatus: OrderState): void {
  const allowed = ORDER_TRANSITIONS[currentStatus];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Cannot move order from ${currentStatus} to ${nextStatus}.`, 409);
  }
}

const locationSchema = z.object({
  area: z.string().optional(),
  fullAddress: z.string().min(1),
  landmark: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
});

const createOrderSchema = z.object({
  cityId: z.string(),
  pickup: locationSchema,
  destination: locationSchema,
  item: z.object({
    category: z.string(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().int().positive().default(1),
    approxWeightKg: z.number().optional(),
    approxSize: z.string().optional(),
    photoUrl: z.string().optional(),
    specialInstructions: z.string().optional(),
  }),
  isEmergency: z.boolean().default(false),
});

export async function createOrder(req: Request, res: Response) {
  const body = createOrderSchema.parse(req.body);
  const customerId = req.auth!.sub;

  const customer = await User.findById(customerId);
  if (!customer) throw new AppError("Customer not found.", 404);
  if (customer.status === "SUSPENDED") throw new AppError("This account is suspended.", 403);

  // Distance and price are ALWAYS computed here — never accepted
  // from the request body, no matter what the client sends.
  const { distanceKm } = await calculateRoadDistanceKm(body.pickup, body.destination);
  const pricing = await calculatePricing({ cityId: body.cityId, distanceKm, isEmergency: body.isEmergency });

  const order = await Order.create({
    customerId,
    cityId: body.cityId,
    pickup: body.pickup,
    destination: body.destination,
    item: body.item,
    isEmergency: body.isEmergency,
    pricing,
    status: "CREATED",
    statusHistory: [{ status: "CREATED" }],
  });

  telegramService.events.newOrder({
    publicId: order.publicId,
    customerName: customer.name,
    pickup: body.pickup.fullAddress,
    destination: body.destination.fullAddress,
    distanceKm: pricing.distanceKm,
    fare: pricing.total,
    paymentMethod: "not yet selected",
  });
  telegramService.events.orderStatusChanged({ orderPublicId: order.publicId, status: order.status, actor: customerId, detail: `Fare ৳${pricing.total}; rider share ৳${pricing.riderEarnings}` });

  res.status(201).json({ order });
}

export async function getOrder(req: Request, res: Response) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found.", 404);

  if (req.auth!.role === "CUSTOMER") {
    assertOwnsResource(String(order.customerId), req.auth!.sub);
  } else if (req.auth!.role === "RIDER") {
    assertOwnsResource(String(order.riderId ?? ""), req.auth!.sub);
  }

  res.json({ order });
}

const cancelOrderSchema = z.object({ reason: z.string().optional() });

export async function cancelOrder(req: Request, res: Response) {
  const { reason } = cancelOrderSchema.parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found.", 404);

  if (req.auth!.role === "CUSTOMER") {
    assertOwnsResource(String(order.customerId), req.auth!.sub);
  }

  applyTransition(order.status as OrderState, "CANCELLED");

  order.status = "CANCELLED";
  order.cancelledBy = req.auth!.role === "ADMIN" ? "ADMIN" : req.auth!.role === "RIDER" ? "RIDER" : "CUSTOMER";
  order.cancellationReason = reason;
  order.statusHistory.push({ status: "CANCELLED", note: reason });
  await order.save();

  telegramService.events.orderCancelled({
    orderPublicId: order.publicId,
    cancelledBy: order.cancelledBy,
    reason,
  });
  telegramService.events.orderStatusChanged({ orderPublicId: order.publicId, status: order.status, actor: req.auth!.role, detail: reason });

  res.json({ order });
}

/** Requests a pickup or delivery OTP be generated for display to the sender/receiver. */
const otpPurposeParam = z.enum(["pickup", "delivery"]);

export async function requestDeliveryOtp(req: Request, res: Response) {
  const purposeParam = otpPurposeParam.parse(req.params.stage);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found.", 404);
  assertOwnsResource(String(order.customerId), req.auth!.sub);

  const purpose = purposeParam === "pickup" ? "PICKUP_VERIFICATION" : "DELIVERY_VERIFICATION";
  const { code, expiresInSeconds } = await issueOtp(String(order.customerId), purpose, String(order._id));
  telegramService.events.otpRequested({ orderPublicId: order.publicId, stage: purposeParam, requestedBy: req.auth!.sub });

  res.json({ devDisplayCode: code, expiresInSeconds });
}

const verifyDeliveryOtpSchema = z.object({ code: z.string().min(4).max(8) });

/** Rider-facing endpoint: rider enters the code shown to them by the sender/receiver. */
export async function verifyDeliveryOtp(req: Request, res: Response) {
  const stage = otpPurposeParam.parse(req.params.stage);
  const { code } = verifyDeliveryOtpSchema.parse(req.body);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found.", 404);
  assertOwnsResource(String(order.riderId ?? ""), req.auth!.sub);

  const purpose = stage === "pickup" ? "PICKUP_VERIFICATION" : "DELIVERY_VERIFICATION";
  await verifyOtp(String(order.customerId), purpose, code);

  if (stage === "pickup") {
    applyTransition(order.status as OrderState, "PICKED_UP");
    order.status = "PICKED_UP";
    order.pickupOtpVerifiedAt = new Date();
    order.statusHistory.push({ status: "PICKED_UP" });
    telegramService.events.pickupVerified({ orderPublicId: order.publicId, riderName: "Rider" });
    telegramService.events.orderStatusChanged({ orderPublicId: order.publicId, status: order.status, actor: req.auth!.sub, detail: "Pickup OTP matched" });
  } else {
    applyTransition(order.status as OrderState, "DELIVERED");
    order.status = "DELIVERED";
    order.deliveryOtpVerifiedAt = new Date();
    order.statusHistory.push({ status: "DELIVERED" });
    telegramService.events.deliveryCompleted({
      orderPublicId: order.publicId,
      customerName: "Customer",
      riderName: "Rider",
      distanceKm: order.pricing?.distanceKm ?? 0,
      customerPaid: order.pricing?.total ?? 0,
      riderEarnings: order.pricing?.riderEarnings ?? 0,
      commission: order.pricing?.nagarGoCommission ?? 0,
    });
    telegramService.events.orderStatusChanged({ orderPublicId: order.publicId, status: order.status, actor: req.auth!.sub, detail: "Delivery OTP matched" });
  }

  await order.save();
  res.json({ order });
}
