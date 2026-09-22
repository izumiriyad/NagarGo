import { Request, Response } from "express";
import { z } from "zod";
import { MedicineOrder } from "../models/MedicineOrder";
import { Rider } from "../models/Rider";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { notify } from "../services/notificationService";
import { telegramService } from "../services/telegramService";

const createSchema = z.object({
  cityId: z.string(),
  destination: z.object({
    fullAddress: z.string().min(5),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  pharmacyName: z.string().min(2),
  pharmacyAddress: z.string().min(5),
  prescriptionUrl: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .min(1),
  medicineSubtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
});

export async function createMedicineOrder(req: Request, res: Response) {
  const body = createSchema.parse(req.body);
  const total = body.medicineSubtotal + body.deliveryFee;

  const order = await MedicineOrder.create({
    customerId: req.auth!.sub,
    cityId: body.cityId,
    destination: body.destination,
    pickup: {
      pharmacyName: body.pharmacyName,
      pharmacyAddress: body.pharmacyAddress,
    },
    prescriptionUrl: body.prescriptionUrl,
    items: body.items,
    pricing: {
      medicineSubtotal: body.medicineSubtotal,
      deliveryFee: body.deliveryFee,
      total,
    },
    statusHistory: [{ status: "SUBMITTED" }],
  });

  telegramService.events.medicineOrderSubmitted({
    publicId: order.publicId,
    pharmacy: body.pharmacyName,
    total,
    hasPrescription: !!body.prescriptionUrl,
  });

  res.status(201).json({ order });
}

export async function getMedicineOrder(req: Request, res: Response) {
  const order = await MedicineOrder.findById(req.params.id);
  if (!order) throw new AppError("Medicine order not found.", 404);
  if (String(order.customerId) !== req.auth!.sub && req.auth!.role !== "ADMIN") {
    throw new AppError("Not found.", 404);
  }
  res.json({ order });
}

export async function listMedicineOrders(_req: Request, res: Response) {
  const orders = await MedicineOrder.find().sort({ createdAt: -1 }).limit(200);
  res.json({ orders });
}

export async function reviewMedicine(req: Request, res: Response) {
  const body = z
    .object({
      decision: z.enum(["APPROVE", "REJECT"]),
      note: z.string().optional(),
    })
    .parse(req.body);

  const order = await MedicineOrder.findById(req.params.id);
  if (!order) throw new AppError("Medicine order not found.", 404);

  const nextStatus = body.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  order.status = nextStatus;
  order.pharmacyVerified = body.decision === "APPROVE";
  order.adminReviewNote = body.note;
  order.statusHistory.push({ status: nextStatus, note: body.note });

  let assignedRider = null;
  if (body.decision === "APPROVE") {
    // Attempt to auto-assign a medicine-eligible rider in the same city.
    assignedRider = await Rider.findOne({
      cityId: order.cityId,
      status: "VERIFIED",
      isOnline: true,
      "serviceEligibility.medicine": true,
    }).sort({ trustScore: -1, rating: -1 });

    if (assignedRider) {
      order.riderId = assignedRider._id;
      order.status = "ASSIGNED";
      order.statusHistory.push({
        status: "ASSIGNED",
        note: "Auto-assigned to a medicine-eligible rider on approval.",
      });
    }
  }

  await order.save();

  await recordAuditAction({
    actorType: "ADMIN",
    actorId: req.auth!.sub,
    action: `MEDICINE_${nextStatus}`,
    targetType: "MedicineOrder",
    targetId: String(order._id),
    reason: body.note,
  });

  telegramService.events.medicineOrderReviewed({
    publicId: order.publicId,
    decision: nextStatus,
    note: body.note,
  });

  // Notify the customer.
  await notify({
    recipientType: "USER",
    recipientId: String(order.customerId),
    type: body.decision === "APPROVE" ? "MEDICINE_APPROVED" : "MEDICINE_REJECTED",
    title:
      body.decision === "APPROVE" ? "Medicine order approved" : "Medicine order rejected",
    body:
      body.decision === "APPROVE"
        ? `Order ${order.publicId} is approved${assignedRider ? " and a rider has been assigned." : " and is waiting for a rider."}`
        : (body.note ?? "Please review the details and resubmit if needed."),
    relatedType: "MedicineOrder",
    relatedId: String(order._id),
  });

  // Notify the assigned rider, if any.
  if (assignedRider) {
    await notify({
      recipientType: "RIDER",
      recipientId: String(assignedRider._id),
      type: "ORDER_ASSIGNED",
      title: "New medicine delivery assigned",
      body: `Pick up from ${order.pickup?.pharmacyName ?? "the pharmacy"} for order ${order.publicId}.`,
      relatedType: "MedicineOrder",
      relatedId: String(order._id),
    });
  }

  res.json({ order });
}
