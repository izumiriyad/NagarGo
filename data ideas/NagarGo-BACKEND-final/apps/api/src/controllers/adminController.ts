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
  await recordAuditAction({ actorType: "ADMIN", actorId: req.auth!.sub, action: `RIDER_${body.decision}D`, targetType: "Rider", targetId: String(rider._id), before: { status: before }, after: { status: rider.status }, reason: body.reason });
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
export async function listOrders(_req: Request, res: Response) { const orders = await Order.find().sort({ createdAt: -1 }).limit(200); res.json({ orders }); }
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
export async function listUsers(_req: Request, res: Response) { res.json({ users: await User.find().select("-savedAddresses").sort({ createdAt: -1 }).limit(200) }); }
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
