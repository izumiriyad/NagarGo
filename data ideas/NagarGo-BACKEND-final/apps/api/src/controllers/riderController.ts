import { Request, Response } from "express";
import { z } from "zod";
import { Rider } from "../models/Rider";
import { Order } from "../models/Order";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { telegramService } from "../services/telegramService";

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
  telegramService.events.riderApplicationReceived({ publicId: rider.publicId, name: rider.fullName, phone: rider.phone, vehicle: rider.vehicle?.type ?? "unspecified" });
  telegramService.events.riderNidDocument({ publicId: rider.publicId, name: rider.fullName, phone: rider.phone, documentUrl: b.nidDocumentUrl });
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
  const rider = await Rider.findByIdAndUpdate(req.auth!.sub, { isOnline: body.online }, { new: true });
  if (!rider) throw new AppError("Rider not found.", 404);
  telegramService.events.riderAvailabilityChanged({ riderPublicId: rider.publicId, riderName: rider.fullName, online: rider.isOnline });
  res.json({ isOnline: rider.isOnline });
}
