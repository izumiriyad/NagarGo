import { Request, Response } from "express";
import { z } from "zod";
import { Rider } from "../models/Rider";
import { Order } from "../models/Order";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { telegramService } from "../services/telegramService";
import { broadcastToAdmins } from "../services/socketRegistry";
import { env } from "../config/env";

const registrationSchema = z.object({
  fullName: z.string().min(2), phone: z.string().min(8).max(20), nidNumber: z.string().min(5), nidDocumentUrl: z.string().min(1),
  address: z.string().min(5), emergencyName: z.string().optional(), emergencyPhone: z.string().optional(),
  vehicleType: z.enum(["BICYCLE", "MOTORCYCLE", "OTHER"]), vehicleDetails: z.string().optional(),
  bkashNumber: z.string().min(8), accountHolderName: z.string().min(2), agreementAccepted: z.literal(true), cityId: z.string().optional(),
});
export async function registerRider(req: Request, res: Response) {
  const b = registrationSchema.parse(req.body);
  const existing = await Rider.findOne({ phone: b.phone });
  if (existing) throw new AppError("A rider application already exists for this phone number.", 409);
  const rider = await Rider.create({ fullName: b.fullName, phone: b.phone, nid: { number: b.nidNumber, documentUrl: b.nidDocumentUrl }, address: b.address,
    emergencyContact: { name: b.emergencyName, phone: b.emergencyPhone }, vehicle: { type: b.vehicleType, details: b.vehicleDetails },
    payoutAccount: { bkashNumber: b.bkashNumber, accountHolderName: b.accountHolderName }, agreementAcceptedAt: new Date(), cityId: b.cityId });
  await recordAuditAction({ actorType: "SYSTEM", action: "RIDER_APPLICATION_SUBMITTED", targetType: "Rider", targetId: String(rider._id), after: { status: rider.status } });
  telegramService.events.riderApplicationReceived({ publicId: rider.publicId, name: rider.fullName, phone: rider.phone, vehicle: rider.vehicle?.type ?? "MOTORCYCLE" });
  res.status(201).json({ rider: { publicId: rider.publicId, status: rider.status } });
}
export async function riderProfile(req: Request, res: Response) {
  const rider = await Rider.findById(req.auth!.sub).select("-payoutAccount.bkashNumber");
  if (!rider) throw new AppError("Rider not found.", 404);
  res.json({ rider });
}
export async function riderOrders(req: Request, res: Response) {
  const orders = await Order.find({ riderId: req.auth!.sub }).sort({ createdAt: -1 }).limit(50);
  res.json({ orders });
}
export async function updateRiderOnline(req: Request, res: Response) {
  const body = z.object({ online: z.boolean() }).parse(req.body);
  const riderBefore = await Rider.findById(req.auth!.sub);
  if (!riderBefore) throw new AppError("Rider not found.", 404);
  if (body.online && riderBefore.status !== "VERIFIED") throw new AppError("Only verified riders can go online.", 403);
  if (body.online && (!riderBefore.currentLocation?.updatedAt || Date.now() - new Date(riderBefore.currentLocation.updatedAt).getTime() > 60_000)) {
    throw new AppError("Turn On Your Live Location before going online.", 409);
  }
  const rider = await Rider.findByIdAndUpdate(req.auth!.sub, { isOnline: body.online }, { new: true });
  if (!rider) throw new AppError("Rider not found.", 404);

  // Broadcast rider online/offline event to all admin clients for live map
  broadcastToAdmins("rider:status-changed", {
    riderId: rider._id,
    publicId: rider.publicId,
    isOnline: rider.isOnline,
    location: rider.currentLocation,
  });

  res.json({ isOnline: rider.isOnline });
}

export async function updateRiderLocation(req: Request, res: Response) {
  const body = z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180) }).parse(req.body);
  const rider = await Rider.findByIdAndUpdate(req.auth!.sub, { currentLocation: { ...body, updatedAt: new Date() } }, { new: true }).select("isOnline currentLocation");
  if (!rider) throw new AppError("Rider not found.", 404);
  res.json({ location: rider.currentLocation, isOnline: rider.isOnline });
}

export async function connectTelegram(req: Request, res: Response) {
  const rider = await Rider.findById(req.auth!.sub);
  if (!rider) throw new AppError("Rider not found.", 404);
  if (!telegramService.isConfigured) throw new AppError("Telegram is not configured on the server.", 503);
  const botUsername = await (async () => {
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    const d = await r.json() as any; return d?.ok ? d.result?.username : null;
  })();
  if (!botUsername) throw new AppError("Telegram bot is unavailable.", 503);
  res.json({ connected: Boolean(rider.telegram?.chatId), botUsername, connectUrl: `https://t.me/${botUsername}?start=rider_${rider.publicId}` });
}

// ---------------------------------------------------------------------------
// Rider profile update
// ---------------------------------------------------------------------------

const updateRiderProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(300).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  vehicleDetails: z.string().max(300).optional(),
  profilePhotoUrl: z.string().optional(),
});

export async function updateRiderProfile(req: Request, res: Response) {
  const body = updateRiderProfileSchema.parse(req.body);
  const rider = await Rider.findById(req.auth!.sub);
  if (!rider) throw new AppError("Rider not found.", 404);

  if (body.fullName !== undefined) rider.fullName = body.fullName;
  if (body.address !== undefined) rider.address = body.address;
  if (body.profilePhotoUrl !== undefined) rider.profilePhotoUrl = body.profilePhotoUrl;
  if (body.vehicleDetails !== undefined && rider.vehicle) rider.vehicle.details = body.vehicleDetails;
  if (body.emergencyContactName !== undefined || body.emergencyContactPhone !== undefined) {
    rider.emergencyContact = {
      name: body.emergencyContactName ?? rider.emergencyContact?.name,
      phone: body.emergencyContactPhone ?? rider.emergencyContact?.phone,
    };
  }

  await rider.save();
  res.json({ rider: await Rider.findById(req.auth!.sub).select("-payoutAccount.bkashNumber") });
}

// ---------------------------------------------------------------------------
// Rider earnings summary
// ---------------------------------------------------------------------------

export async function riderEarnings(req: Request, res: Response) {
  const { Payment } = await import("../models/Payment");

  const riderId = req.auth!.sub;
  const rider = await Rider.findById(riderId).select("completedDeliveries rating cancellationCount");
  if (!rider) throw new AppError("Rider not found.", 404);

  // All delivered orders assigned to this rider
  const deliveredOrders = await Order.find({ riderId, status: "DELIVERED" }).select("pricing createdAt paymentId");

  const totalEarned = deliveredOrders.reduce((sum, o) => sum + (o.pricing?.riderEarnings ?? 0), 0);

  // This calendar month
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonthEarned = deliveredOrders
    .filter((o) => new Date(o.createdAt as Date) >= monthStart)
    .reduce((sum, o) => sum + (o.pricing?.riderEarnings ?? 0), 0);

  // COD orders that are delivered but payment not yet confirmed
  const pendingCodCount = await Order.countDocuments({ riderId, status: "DELIVERED" });

  res.json({
    earnings: {
      totalEarned: Math.round(totalEarned * 100) / 100,
      thisMonthEarned: Math.round(thisMonthEarned * 100) / 100,
      completedDeliveries: rider.completedDeliveries,
      cancellationCount: rider.cancellationCount,
      averageRating: rider.rating,
      pendingPayout: 0, // Phase 4: calculate real pending payout once settlement model is built
    },
  });
}
