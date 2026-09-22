import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Rider } from "../models/Rider";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { PricingConfig } from "../models/PricingConfig";
import { PaymentConfig } from "../models/PaymentConfig";
import { AuditLog } from "../models/AuditLog";
import { Content } from "../models/Content";
import { FeatureFlag } from "../models/FeatureFlag";
import { Dispute } from "../models/Dispute";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { notify } from "../services/notificationService";
import { telegramService } from "../services/telegramService";

export async function dashboard(_req: Request, res: Response) {
  const [users, riders, pendingRiders, orders, activeOrders, payments, pendingPayments, delivered] = await Promise.all([
    User.countDocuments(), Rider.countDocuments(), Rider.countDocuments({ status: { $in: ["PENDING", "UNDER_REVIEW"] } }), Order.countDocuments(),
    Order.countDocuments({ status: { $nin: ["DELIVERED", "CANCELLED", "FAILED"] } }), Payment.countDocuments(), Payment.countDocuments({ status: { $in: ["SUBMITTED", "UNDER_REVIEW"] } }),
    Order.countDocuments({ status: "DELIVERED" }),
  ]);
  res.json({ metrics: { users, riders, pendingRiders, orders, activeOrders, payments, pendingPayments, delivered } });
}
export async function listRiders(req: Request, res: Response) { const status = typeof req.query.status === "string" ? req.query.status : undefined; const riders = await Rider.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(200); res.json({ riders }); }
export async function reviewRider(req: Request, res: Response) {
  const body = z.object({ decision: z.enum(["APPROVE", "REJECT", "SUSPEND"]), reason: z.string().optional() }).parse(req.body);
  const rider = await Rider.findById(req.params.id); if (!rider) throw new AppError("Rider not found.", 404);
  const before = rider.status; rider.status = body.decision === "APPROVE" ? "VERIFIED" : body.decision === "REJECT" ? "REJECTED" : "SUSPENDED"; rider.rejectionReason = body.reason; await rider.save();
  await recordAuditAction({ actorType: "ADMIN", actorId: req.auth!.sub, action: `RIDER_${body.decision}D`, targetType: "Rider", targetId: String(rider._id), before: { status: before }, after: { status: rider.status }, reason: body.reason, ipAddress: req.ip });
  await notify({
    recipientType: "RIDER", recipientId: String(rider._id),
    type: body.decision === "APPROVE" ? "RIDER_APPROVED" : "RIDER_REJECTED",
    title: body.decision === "APPROVE" ? "You're approved!" : body.decision === "REJECT" ? "Application not approved" : "Account suspended",
    body: body.decision === "APPROVE" ? "Your NagarGo rider application has been approved. You can now sign in and go online." : (body.reason ?? "Please contact support for details."),
    relatedType: "Rider", relatedId: String(rider._id),
  });
  if (body.decision === "APPROVE") {
    telegramService.events.riderVerified({ publicId: rider.publicId, name: rider.fullName });
  } else {
    telegramService.events.riderRejectedOrSuspended({ publicId: rider.publicId, name: rider.fullName, decision: body.decision === "REJECT" ? "REJECTED" : "SUSPENDED", reason: body.reason });
  }
  res.json({ rider });
}
export async function listPayments(_req: Request, res: Response) { const payments = await Payment.find().sort({ createdAt: -1 }).limit(200); res.json({ payments }); }
export async function pricing(req: Request, res: Response) {
  if (req.method === "GET") return res.json({ configs: await PricingConfig.find().sort({ updatedAt: -1 }) });
  const body = z.object({ cityId: z.string(), baseFare: z.number().nonnegative(), perKmRate: z.number().nonnegative(), minimumFare: z.number().nonnegative(), serviceFee: z.number().nonnegative(), peakMultiplier: z.number().positive(), emergencyMultiplier: z.number().positive(), riderCommissionPercent: z.number().min(0).max(100), nagarGoCommissionPercent: z.number().min(0).max(100), isPeakActive: z.boolean() }).parse(req.body);
  if (body.riderCommissionPercent + body.nagarGoCommissionPercent !== 100) throw new AppError("Commission percentages must total 100.", 400);
  const config = await PricingConfig.findOneAndUpdate({ cityId: body.cityId }, { ...body, updatedByAdminId: req.auth!.sub }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await recordAuditAction({ actorType: "ADMIN", actorId: req.auth!.sub, action: "PRICING_UPDATED", targetType: "PricingConfig", targetId: String(config._id), after: body }); res.json({ config });
}
export async function paymentConfig(req: Request, res: Response) {
  const body = z.object({ codEnabled: z.boolean(), payRiderEnabled: z.boolean(), payAdminEnabled: z.boolean(), adminBkash: z.object({ number: z.string(), accountType: z.string(), instruction: z.string(), displayName: z.string() }) }).parse(req.body);
  const config = await PaymentConfig.findOneAndUpdate({ key: "default" }, { ...body, updatedByAdminId: req.auth!.sub }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ config });
}
export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select("-savedAddresses -passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page, pages: Math.ceil(total / limit) });
}
export async function setUserStatus(req: Request, res: Response) { const body = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).parse(req.body); const user = await User.findByIdAndUpdate(req.params.id, { status: body.status }, { new: true }); if (!user) throw new AppError("User not found.", 404); res.json({ user }); }
export async function auditLogs(_req: Request, res: Response) { res.json({ logs: await AuditLog.find().sort({ createdAt: -1 }).limit(300) }); }
export async function content(req: Request, res: Response) {
  if (req.method === "GET") return res.json({ content: await Content.find().sort({ key: 1, locale: 1 }) });
  const body = z.object({ key: z.string(), title: z.string().optional(), body: z.string().optional(), locale: z.enum(["en", "bn"]), published: z.boolean() }).parse(req.body);
  const item = await Content.findOneAndUpdate({ key: body.key, locale: body.locale }, { ...body, updatedByAdminId: req.auth!.sub }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ item });
}
export async function flags(req: Request, res: Response) {
  if (req.method === "GET") return res.json({ flags: await FeatureFlag.find().sort({ key: 1 }) });
  const body = z.object({ key: z.string(), enabled: z.boolean(), description: z.string().optional() }).parse(req.body);
  const flag = await FeatureFlag.findOneAndUpdate({ key: body.key }, { ...body, updatedByAdminId: req.auth!.sub }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ flag });
}
export async function listDisputes(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const disputes = await Dispute.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(200);
  res.json({ disputes });
}
export async function resolveDispute(req: Request, res: Response) {
  const body = z.object({ decision: z.enum(["RESOLVED_CUSTOMER", "RESOLVED_RIDER", "DISMISSED"]), note: z.string().optional() }).parse(req.body);
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw new AppError("Dispute not found.", 404);
  const before = dispute.status;
  dispute.status = body.decision;
  dispute.resolutionNote = body.note;
  dispute.resolvedByAdminId = req.auth!.sub as unknown as typeof dispute.resolvedByAdminId;
  dispute.resolvedAt = new Date();
  await dispute.save();
  await recordAuditAction({ actorType: "ADMIN", actorId: req.auth!.sub, action: "DISPUTE_RESOLVED", targetType: "Dispute", targetId: String(dispute._id), before: { status: before }, after: { status: dispute.status }, reason: body.note });
  await notify({
    recipientType: "USER", recipientId: String(dispute.customerId),
    type: "DISPUTE_RESOLVED", title: "Your dispute has been reviewed",
    body: body.note ?? `Outcome: ${body.decision.replace("_", " ").toLowerCase()}.`,
    relatedType: "Dispute", relatedId: String(dispute._id),
  });
  res.json({ dispute });
  const order = await Order.findById(dispute.orderId).select("publicId");
  telegramService.events.disputeResolved({ orderPublicId: order?.publicId ?? String(dispute.orderId), decision: body.decision, note: body.note });
}

// ---------------------------------------------------------------------------
// Admin analytics
// ---------------------------------------------------------------------------

export async function analytics(req: Request, res: Response) {
  const period = req.query.period === "month" ? "month" : "week";

  const now = new Date();
  const periodStart = new Date();
  if (period === "week") {
    periodStart.setDate(now.getDate() - 7);
  } else {
    periodStart.setMonth(now.getMonth() - 1);
  }

  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    periodOrders,
    periodDelivered,
    recentDeliveredWithPricing,
    topRiders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "DELIVERED" }),
    Order.countDocuments({ status: "CANCELLED" }),
    Order.countDocuments({ createdAt: { $gte: periodStart } }),
    Order.countDocuments({ status: "DELIVERED", createdAt: { $gte: periodStart } }),
    // Revenue: sum riderEarnings + platform fee from delivered orders in period
    Order.find({ status: "DELIVERED", createdAt: { $gte: periodStart } }).select("pricing"),
    // Top 5 riders by completed deliveries
    Rider.find({ completedDeliveries: { $gt: 0 } })
      .sort({ completedDeliveries: -1 })
      .limit(5)
      .select("fullName publicId completedDeliveries rating cancellationCount"),
  ]);

  const totalRevenue = recentDeliveredWithPricing.reduce((sum, o) => sum + (o.pricing?.total ?? 0), 0);
  const platformFee = recentDeliveredWithPricing.reduce((sum, o) => sum + ((o.pricing?.total ?? 0) - (o.pricing?.riderEarnings ?? 0)), 0);
  const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 10000) / 100 : 0;

  res.json({
    analytics: {
      period,
      periodStart,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      cancellationRate,
      periodOrders,
      periodDelivered,
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        currency: "BDT",
      },
      topRiders,
    },
  });
}

// ---------------------------------------------------------------------------
// Admin: paginated orders list with status/date filters
// ---------------------------------------------------------------------------

export async function listOrders(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.riderId) filter.riderId = req.query.riderId;
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) (filter.createdAt as Record<string, Date>).$gte = new Date(req.query.from as string);
    if (req.query.to) (filter.createdAt as Record<string, Date>).$lte = new Date(req.query.to as string);
  }

  // Server-side text search across publicId and addresses
  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q) {
      filter.$or = [
        { publicId: { $regex: q, $options: "i" } },
        { "pickup.fullAddress": { $regex: q, $options: "i" } },
        { "destination.fullAddress": { $regex: q, $options: "i" } },
      ];
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name phone publicId")
      .populate("riderId", "fullName phone publicId"),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

// ---------------------------------------------------------------------------
// Admin: online/active riders with location
// ---------------------------------------------------------------------------

export async function activeRiders(_req: Request, res: Response) {
  const riders = await Rider.find({ isOnline: true, status: "VERIFIED" })
    .select("fullName publicId vehicle currentLocation phone telegram.chatId isOnline")
    .sort({ "currentLocation.updatedAt": -1 });
  res.json({ riders, count: riders.length });
}

// ---------------------------------------------------------------------------
// Admin: rider earnings detail
// ---------------------------------------------------------------------------

export async function riderEarningsAdmin(req: Request, res: Response) {
  const rider = await Rider.findById(req.params.id).select("fullName publicId completedDeliveries rating cancellationCount");
  if (!rider) throw new AppError("Rider not found.", 404);

  const deliveredOrders = await Order.find({ riderId: req.params.id, status: "DELIVERED" }).select("pricing createdAt publicId");
  const totalEarned = deliveredOrders.reduce((sum, o) => sum + (o.pricing?.riderEarnings ?? 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonthEarned = deliveredOrders
    .filter((o) => new Date(o.createdAt as Date) >= monthStart)
    .reduce((sum, o) => sum + (o.pricing?.riderEarnings ?? 0), 0);

  res.json({
    rider,
    earnings: {
      totalEarned: Math.round(totalEarned * 100) / 100,
      thisMonthEarned: Math.round(thisMonthEarned * 100) / 100,
      completedDeliveries: rider.completedDeliveries,
      cancellationCount: rider.cancellationCount,
      averageRating: rider.rating,
      deliveries: deliveredOrders.map((o) => ({
        publicId: o.publicId,
        createdAt: o.createdAt,
        earned: o.pricing?.riderEarnings ?? 0,
      })),
    },
  });
}
