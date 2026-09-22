import { Request, Response } from "express";
import { z } from "zod";
import { Payment, PAYMENT_METHODS } from "../models/Payment";
import { Order, OrderState } from "../models/Order";
import { getOrCreatePaymentConfig } from "../models/PaymentConfig";
import { AppError } from "../middleware/errorHandler";
import { assertOwnsResource } from "../middleware/auth";
import { telegramService } from "../services/telegramService";
import { recordAuditAction } from "../services/auditService";
import { notify } from "../services/notificationService";
import { applyTransition } from "./orderController";

/** Public, non-sensitive payment options — safe to show to any customer. */
export async function getPaymentConfig(req: Request, res: Response) {
  const config = await getOrCreatePaymentConfig();
  let riderBkash: { number: string; accountHolderName: string; accountType?: string } | undefined;
  const orderId = typeof req.query.orderId === "string" ? req.query.orderId : undefined;
  if (orderId) {
    const order = await Order.findById(orderId).select("customerId riderId");
    if (order) {
      assertOwnsResource(String(order.customerId), req.auth?.sub ?? "");
      if (order.riderId) {
        const { Rider } = await import("../models/Rider");
        const rider = await Rider.findById(order.riderId).select("payoutAccount");
        if (rider?.payoutAccount?.verified) riderBkash = { number: rider.payoutAccount.bkashNumber, accountHolderName: rider.payoutAccount.accountHolderName, accountType: rider.payoutAccount.accountType };
      }
    }
  }
  res.json({
    codEnabled: config.codEnabled,
    payRiderEnabled: config.payRiderEnabled,
    payAdminEnabled: config.payAdminEnabled,
    adminBkash: config.adminBkash,
    minimumPayment: config.minimumPayment,
    riderBkash,
  });
}

const selectMethodSchema = z.object({
  orderId: z.string(),
  method: z.enum(PAYMENT_METHODS),
});

export async function selectPaymentMethod(req: Request, res: Response) {
  const { orderId, method } = selectMethodSchema.parse(req.body);
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  assertOwnsResource(String(order.customerId), req.auth!.sub);

  const config = await getOrCreatePaymentConfig();
  if (method === "COD_LIVE" && !config.codEnabled) throw new AppError("This payment method is unavailable.", 400);
  if (method === "PAY_TO_RIDER" && !config.payRiderEnabled) throw new AppError("This payment method is unavailable.", 400);
  if (method === "PAY_TO_ADMIN" && !config.payAdminEnabled) throw new AppError("This payment method is unavailable.", 400);

  const payment = await Payment.create({
    orderId: order._id,
    method,
    amount: order.pricing?.total ?? 0,
    status: method === "COD_LIVE" ? "PENDING" : "PENDING",
  });

  order.paymentId = payment._id;
  applyTransition(order.status as OrderState, "PAYMENT_PENDING");
  order.status = "PAYMENT_PENDING";
  order.statusHistory.push({ status: "PAYMENT_PENDING" });
  if (method === "COD_LIVE") {
    applyTransition(order.status as OrderState, "PAYMENT_CONFIRMED");
    order.status = "PAYMENT_CONFIRMED";
    order.statusHistory.push({ status: "PAYMENT_CONFIRMED", note: "COD selected; payment is collected at delivery." });
    applyTransition(order.status as OrderState, "SEARCHING_RIDER");
    order.status = "SEARCHING_RIDER";
    order.statusHistory.push({ status: "SEARCHING_RIDER" });
  }
  await order.save();

  res.status(201).json({ payment });
}

const submitTransactionSchema = z.object({
  transactionId: z.string().min(3).max(64),
  amount: z.number().positive(),
  paymentTime: z.coerce.date(),
  screenshotUrl: z.string().optional(),
});

/**
 * Customer submits proof of a Pay-Rider or Pay-Admin transfer.
 * Server-side checks here are the anti-fraud core described in the
 * spec: no duplicate transaction ID reuse, amount must match the
 * order total, and the order must be in a state where a payment
 * submission is expected.
 */
export async function submitTransaction(req: Request, res: Response) {
  const paymentId = req.params.id;
  const body = submitTransactionSchema.parse(req.body);

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment record not found.", 404);
  if (payment.method === "COD_LIVE") {
    throw new AppError("Cash on delivery does not require a transaction ID.", 400);
  }

  const order = await Order.findById(payment.orderId);
  if (!order) throw new AppError("Order not found.", 404);
  assertOwnsResource(String(order.customerId), req.auth!.sub);

  if (Math.abs(body.amount - payment.amount) > 0.01) {
    throw new AppError("The submitted amount does not match the order total.", 400);
  }

  const duplicate = await Payment.findOne({
    method: payment.method,
    transactionId: body.transactionId,
    _id: { $ne: payment._id },
  });
  if (duplicate) {
    throw new AppError("This transaction ID has already been used for another order.", 409);
  }

  payment.transactionId = body.transactionId;
  payment.paymentTime = body.paymentTime;
  payment.screenshotUrl = body.screenshotUrl;
  payment.status = "SUBMITTED";
  payment.submittedByUserId = req.auth!.sub as unknown as typeof payment.submittedByUserId;
  await payment.save();

  applyTransition(order.status as OrderState, "PAYMENT_SUBMITTED");
  order.status = "PAYMENT_SUBMITTED";
  order.statusHistory.push({ status: "PAYMENT_SUBMITTED" });
  await order.save();

  telegramService.events.paymentSubmitted({
    orderPublicId: order.publicId,
    method: payment.method,
    amount: payment.amount,
    transactionId: payment.transactionId,
  });

  res.json({ payment });
}

const verifyPaymentSchema = z.object({
  decision: z.enum(["VERIFY", "REJECT"]),
  reason: z.string().optional(),
});

/** Admin-only: verifies or rejects a submitted payment. */
export async function verifyPayment(req: Request, res: Response) {
  const paymentId = req.params.id;
  const { decision, reason } = verifyPaymentSchema.parse(req.body);

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment record not found.", 404);

  const order = await Order.findById(payment.orderId);
  if (!order) throw new AppError("Order not found.", 404);

  const beforeStatus = payment.status;

  if (decision === "VERIFY") {
    payment.status = "VERIFIED";
    payment.verifiedByAdminId = req.auth!.sub as unknown as typeof payment.verifiedByAdminId;
    payment.verifiedAt = new Date();

    applyTransition(order.status as OrderState, "PAYMENT_CONFIRMED");
    order.status = "PAYMENT_CONFIRMED";
    order.statusHistory.push({ status: "PAYMENT_CONFIRMED" });
    applyTransition(order.status as OrderState, "SEARCHING_RIDER");
    order.status = "SEARCHING_RIDER";
    order.statusHistory.push({ status: "SEARCHING_RIDER" });

    telegramService.events.paymentVerified({
      orderPublicId: order.publicId,
      method: payment.method,
      amount: payment.amount,
      transactionId: payment.transactionId ?? "-",
    });
  } else {
    payment.status = "REJECTED";
    payment.rejectionReason = reason;
    telegramService.events.paymentRejected({
      orderPublicId: order.publicId,
      method: payment.method,
      amount: payment.amount,
      reason,
    });
  }

  await payment.save();
  await order.save();

  await notify({
    recipientType: "USER", recipientId: String(order.customerId),
    type: decision === "VERIFY" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
    title: decision === "VERIFY" ? "Payment verified" : "Payment rejected",
    body: decision === "VERIFY"
      ? `Your payment for order ${order.publicId} has been verified. We're now finding you a rider.`
      : (reason ?? `Your payment for order ${order.publicId} could not be verified.`),
    relatedType: "Order", relatedId: String(order._id),
  });

  await recordAuditAction({
    actorType: "ADMIN",
    actorId: req.auth!.sub,
    action: decision === "VERIFY" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
    targetType: "Payment",
    targetId: String(payment._id),
    before: { status: beforeStatus },
    after: { status: payment.status },
    reason,
    ipAddress: req.ip,
  });

  res.json({ payment, order });
}
