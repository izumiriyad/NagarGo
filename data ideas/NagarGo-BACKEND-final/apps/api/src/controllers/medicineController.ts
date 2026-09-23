import { Request, Response } from "express";
import { z } from "zod";
import { MedicineOrder } from "../models/MedicineOrder";
import { Rider } from "../models/Rider";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { notify } from "../services/notificationService";
import { telegramService } from "../services/telegramService";

const schema = z.object({ cityId: z.string(), destination: z.object({ fullAddress: z.string().min(5), lat: z.number().optional(), lng: z.number().optional() }), pharmacyName: z.string().min(2), pharmacyAddress: z.string().min(5), prescriptionUrl: z.string().optional(), items: z.array(z.object({ name: z.string(), quantity: z.number().int().positive(), notes: z.string().optional() })).min(1), medicineSubtotal: z.number().nonnegative(), deliveryFee: z.number().nonnegative() });
export async function createMedicineOrder(req: Request, res: Response) { const b = schema.parse(req.body); const total = b.medicineSubtotal + b.deliveryFee; const order = await MedicineOrder.create({ customerId: req.auth!.sub, cityId: b.cityId, destination: b.destination, pickup: { pharmacyName: b.pharmacyName, pharmacyAddress: b.pharmacyAddress }, prescriptionUrl: b.prescriptionUrl, items: b.items, pricing: { medicineSubtotal: b.medicineSubtotal, deliveryFee: b.deliveryFee, total }, statusHistory: [{ status: "SUBMITTED" }] }); telegramService.events.medicineOrderSubmitted({ publicId: order.publicId, pharmacy: b.pharmacyName, total, hasPrescription: !!b.prescriptionUrl }); res.status(201).json({ order }); }
export async function getMedicineOrder(req: Request, res: Response) { const order = await MedicineOrder.findById(req.params.id); if (!order) throw new AppError("Medicine order not found.", 404); if (String(order.customerId) !== req.auth!.sub && req.auth!.role !== "ADMIN") throw new AppError("Not found.", 404); res.json({ order }); }
export async function listMedicineOrders(_req: Request, res: Response) { res.json({ orders: await MedicineOrder.find().sort({ createdAt: -1 }).limit(200) }); }
export async function reviewMedicine(req: Request, res: Response) { const b = z.object({ decision: z.enum(["APPROVE", "REJECT"]), note: z.string().optional() }).parse(req.body); const order = await MedicineOrder.findById(req.params.id); if (!order) throw new AppError("Medicine order not found.", 404); const next = b.decision === "APPROVE" ? "APPROVED" : "REJECTED"; order.status = next; order.pharmacyVerified = b.decision === "APPROVE"; order.adminReviewNote = b.note; order.statusHistory.push({ status: next, note: b.note });
  let assignedRider = null;
  if (b.decision === "APPROVE") {
    assignedRider = await Rider.findOne({ cityId: order.cityId, status: "VERIFIED", isOnline: true, "serviceEligibility.medicine": true }).sort({ trustScore: -1, rating: -1 });
    if (assignedRider) {
      order.riderId = assignedRider._id;
      order.status = "ASSIGNED";
      order.statusHistory.push({ status: "ASSIGNED", note: "Auto-assigned to a medicine-eligible rider on approval." });
    }
  }
  await order.save();
  await recordAuditAction({ actorType: "ADMIN", actorId: req.auth!.sub, action: `MEDICINE_${next}`, targetType: "MedicineOrder", targetId: String(order._id), reason: b.note });
  telegramService.events.medicineOrderReviewed({ publicId: order.publicId, decision: next, note: b.note });
  await notify({
    recipientType: "USER", recipientId: String(order.customerId),
    type: b.decision === "APPROVE" ? "MEDICINE_APPROVED" : "MEDICINE_REJECTED",
    title: b.decision === "APPROVE" ? "Medicine order approved" : "Medicine order rejected",
    body: b.decision === "APPROVE" ? `Order ${order.publicId} is approved${assignedRider ? " and a rider has been assigned." : " and is waiting for a rider."}` : (b.note ?? "Please review the details and resubmit if needed."),
    relatedType: "MedicineOrder", relatedId: String(order._id),
  });
  if (assignedRider) {
    await notify({
      recipientType: "RIDER", recipientId: String(assignedRider._id),
      type: "ORDER_ASSIGNED", title: "New medicine delivery assigned",
      body: `Pick up from ${order.pickup?.pharmacyName ?? "the pharmacy"} for order ${order.publicId}.`,
      relatedType: "MedicineOrder", relatedId: String(order._id),
    });
  }
  res.json({ order });
}
