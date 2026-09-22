import { Schema, model, InferSchemaType } from "mongoose";

export const PAYMENT_METHODS = ["COD_LIVE", "PAY_TO_RIDER", "PAY_TO_ADMIN"] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "REFUNDED",
  "FAILED",
  "CANCELLED",
] as const;

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderModel: { type: String, enum: ["Order", "MedicineOrder"], default: "Order" },

    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: "PENDING", index: true },

    amount: { type: Number, required: true },

    // Only relevant for PAY_TO_RIDER / PAY_TO_ADMIN.
    transactionId: { type: String, index: true },
    paymentTime: { type: Date },
    screenshotUrl: { type: String },

    submittedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminAccount" },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// A given transaction ID must not be reusable across unrelated
// orders for the same payment method — core anti-fraud control
// from the spec. Partial index so it only applies once a
// transaction ID has actually been submitted.
paymentSchema.index(
  { method: 1, transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $type: "string" } } }
);

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const Payment = model("Payment", paymentSchema);
