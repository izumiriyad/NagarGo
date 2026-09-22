import { Schema, model, InferSchemaType } from "mongoose";

const disputeSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    riderId: { type: Schema.Types.ObjectId, ref: "Rider" },

    reason: { type: String, required: true, maxlength: 1000 },
    category: {
      type: String,
      enum: ["DAMAGED_ITEM", "LATE_DELIVERY", "WRONG_ITEM", "PAYMENT_ISSUE", "RIDER_CONDUCT", "OTHER"],
      default: "OTHER",
    },

    status: { type: String, enum: ["OPEN", "UNDER_REVIEW", "RESOLVED_CUSTOMER", "RESOLVED_RIDER", "DISMISSED"], default: "OPEN", index: true },
    resolutionNote: { type: String },
    resolvedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminAccount" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

disputeSchema.index({ status: 1, createdAt: -1 });

export type DisputeDocument = InferSchemaType<typeof disputeSchema>;
export const Dispute = model("Dispute", disputeSchema);
