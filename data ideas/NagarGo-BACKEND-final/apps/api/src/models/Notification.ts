import { Schema, model, InferSchemaType } from "mongoose";

// Recipient is polymorphic (customer, rider, or admin) — recipientType
// tells us which collection recipientId points at.
const notificationSchema = new Schema(
  {
    recipientType: { type: String, enum: ["USER", "RIDER", "ADMIN"], required: true },
    recipientId: { type: Schema.Types.ObjectId, required: true, index: true },

    type: {
      type: String,
      enum: [
        "ORDER_ASSIGNED",
        "ORDER_STATUS_CHANGED",
        "PAYMENT_VERIFIED",
        "PAYMENT_REJECTED",
        "RIDER_APPROVED",
        "RIDER_REJECTED",
        "MEDICINE_APPROVED",
        "MEDICINE_REJECTED",
        "DISPUTE_OPENED",
        "DISPUTE_RESOLVED",
        "RATING_RECEIVED",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    relatedType: { type: String, enum: ["Order", "MedicineOrder", "Payment", "Rider", "Dispute"] },
    relatedId: { type: Schema.Types.ObjectId },

    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);
