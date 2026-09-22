import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { Rider } from "../models/Rider";
import { Rating } from "../models/Rating";
import { Dispute } from "../models/Dispute";
import { MedicineOrder } from "../models/MedicineOrder";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { notify } from "../services/notificationService";
import { telegramService } from "../services/telegramService";
import { calculatePricing } from "../services/pricingService";
import { calculateRoute } from "../services/mapService";

// ---------------------------------------------------------------------------
// Saved addresses
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  label: z.enum(["HOME", "WORK", "OTHER"]),
  customLabel: z.string().optional(),
  address: z.string(),
  landmark: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function savedAddresses(req: Request, res: Response) {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw new AppError("User not found.", 404);

  if (req.method === "GET") {
    return res.json({ addresses: user.savedAddresses });
  }

  const body = addressSchema.parse(req.body);
  user.savedAddresses.push(body);
  await user.save();
  res.status(201).json({ addresses: user.savedAddresses });
}

export async function deleteSavedAddress(req: Request, res: Response) {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw new AppError("User not found.", 404);

  const addressId = req.params.id;
  if (!addressId) throw new AppError("Address ID is required.", 400);

  const item = user.savedAddresses.id(addressId);
  if (!item) throw new AppError("Address not found.", 404);

  item.deleteOne();
  await user.save();
  res.json({ addresses: user.savedAddresses });
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export async function rateOrder(req: Request, res: Response) {
  const body = z
    .object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional(),
    })
    .parse(req.body);

  const order = await Order.findById(req.params.id);
  if (
    !order ||
    String(order.customerId) !== req.auth!.sub ||
    order.status !== "DELIVERED" ||
    !order.riderId
  ) {
    throw new AppError("Order cannot be rated.", 400);
  }
  if (await Rating.exists({ orderId: order._id })) {
    throw new AppError("This order has already been rated.", 409);
  }

  const rating = await Rating.create({
    orderId: order._id,
    customerId: req.auth!.sub,
    riderId: order.riderId,
    rating: body.rating,
    comment: body.comment,
  });

  const rider = await Rider.findById(order.riderId);
  if (rider) {
    const count = Math.max(1, rider.completedDeliveries);
    rider.rating = Math.round(((rider.rating * (count - 1) + body.rating) / count) * 100) / 100;
    await rider.save();

    await notify({
      recipientType: "RIDER",
      recipientId: String(rider._id),
      type: "RATING_RECEIVED",
      title: "You received a new rating",
      body: `${body.rating}/5 for order ${order.publicId}${body.comment ? `: "${body.comment}"` : "."}`,
      relatedType: "Order",
      relatedId: String(order._id),
    });

    telegramService.events.ratingReceived({
      orderPublicId: order.publicId,
      riderName: rider.fullName,
      rating: body.rating,
      comment: body.comment,
    });
  }

  order.ratedByCustomer = true;
  await order.save();
  res.status(201).json({ rating });
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export async function disputeOrder(req: Request, res: Response) {
  const body = z
    .object({
      reason: z.string().min(5).max(1000),
      category: z
        .enum(["DAMAGED_ITEM", "LATE_DELIVERY", "WRONG_ITEM", "PAYMENT_ISSUE", "RIDER_CONDUCT", "OTHER"])
        .default("OTHER"),
    })
    .parse(req.body);

  const order = await Order.findById(req.params.id);
  if (!order || String(order.customerId) !== req.auth!.sub) {
    throw new AppError("Order not found.", 404);
  }
  if (
    order.status !== "DELIVERED" &&
    order.status !== "IN_TRANSIT" &&
    order.status !== "DELIVERY_OTP_PENDING"
  ) {
    throw new AppError("This order cannot be disputed at its current stage.", 400);
  }

  order.status = "DISPUTED";
  order.statusHistory.push({ status: "DISPUTED", note: body.reason });
  await order.save();

  const dispute = await Dispute.create({
    orderId: order._id,
    customerId: req.auth!.sub,
    riderId: order.riderId,
    reason: body.reason,
    category: body.category,
  });

  await recordAuditAction({
    actorType: "CUSTOMER",
    actorId: req.auth!.sub,
    action: "ORDER_DISPUTED",
    targetType: "Order",
    targetId: String(order._id),
    reason: body.reason,
  });

  telegramService.events.newDispute({ orderPublicId: order.publicId, type: body.category });

  res.status(201).json({ order, dispute });
}

export async function myDisputes(req: Request, res: Response) {
  const disputes = await Dispute.find({ customerId: req.auth!.sub }).sort({ createdAt: -1 });
  res.json({ disputes });
}

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

export async function referral(req: Request, res: Response) {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw new AppError("User not found.", 404);

  if (!user.referralCode) {
    user.referralCode = `NG${String(user._id).slice(-6).toUpperCase()}`;
    await user.save();
  }

  res.json({ referralCode: user.referralCode });
}

// ---------------------------------------------------------------------------
// Fare estimator (public — no auth, no order created)
// ---------------------------------------------------------------------------

const fareEstimateSchema = z.object({
  cityId: z.string().min(1),
  pickup: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.object({ lat: z.number(), lng: z.number() }),
  isEmergency: z.boolean().default(false),
});

/**
 * Returns a full pricing breakdown for given coordinates without
 * creating an order — used by the frontend booking form to show the
 * customer a fare estimate before they commit. Server-side pricing
 * is still re-run at order creation; this is purely for display.
 */
export async function fareEstimate(req: Request, res: Response) {
  const body = fareEstimateSchema.parse(req.query.cityId ? req.query : req.body);
  const route = await calculateRoute(body.pickup, body.destination);
  const pricing = await calculatePricing({
    cityId: body.cityId,
    distanceKm: route.distanceKm,
    estimatedMinutes: route.estimatedMinutes,
    isEmergency: body.isEmergency,
  });
  res.json({ pricing, routeSource: route.source });
}

// ---------------------------------------------------------------------------
// Saved address — update
// ---------------------------------------------------------------------------

export async function updateSavedAddress(req: Request, res: Response) {
  const body = addressSchema.partial().parse(req.body);
  const user = await User.findById(req.auth!.sub);
  if (!user) throw new AppError("User not found.", 404);

  const item = user.savedAddresses.id(req.params.id as string);
  if (!item) throw new AppError("Address not found.", 404);

  if (body.label !== undefined) item.label = body.label;
  if (body.customLabel !== undefined) item.customLabel = body.customLabel;
  if (body.address !== undefined) item.address = body.address;
  if (body.landmark !== undefined) item.landmark = body.landmark;
  if (body.lat !== undefined) item.lat = body.lat;
  if (body.lng !== undefined) item.lng = body.lng;

  await user.save();
  res.json({ addresses: user.savedAddresses });
}

// ---------------------------------------------------------------------------
// Medicine orders — customer view
// ---------------------------------------------------------------------------

export async function myMedicineOrders(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    MedicineOrder.find({ customerId: req.auth!.sub })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MedicineOrder.countDocuments({ customerId: req.auth!.sub }),
  ]);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

export async function getMyMedicineOrder(req: Request, res: Response) {
  const order = await MedicineOrder.findById(req.params.id);
  if (!order || String(order.customerId) !== req.auth!.sub) {
    throw new AppError("Medicine order not found.", 404);
  }
  res.json({ order });
}
