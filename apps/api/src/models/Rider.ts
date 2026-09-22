import { Schema, model, InferSchemaType } from "mongoose";
import { generatePublicId } from "../utils/idGenerator";

export const RIDER_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
] as const;

const riderSchema = new Schema(
  {
    publicId: { type: String, unique: true, index: true, default: () => generatePublicId("NGR") },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    profilePhotoUrl: { type: String },

    nid: {
      number: { type: String, required: true },
      documentUrl: { type: String, required: true },
    },
    address: { type: String, required: true },
    emergencyContact: {
      name: String,
      phone: String,
    },

    vehicle: {
      type: { type: String, enum: ["BICYCLE", "MOTORCYCLE", "OTHER"], required: true },
      details: { type: String },
    },

    // Private payout info. Never returned to customer-facing endpoints —
    // only exposed via a dedicated, order-scoped "pay rider" projection
    // and to the rider/admin themselves. See paymentController.
    payoutAccount: {
      bkashNumber: { type: String, required: true },
      accountHolderName: { type: String, required: true },
      accountType: { type: String, default: "Personal" },
      verified: { type: Boolean, default: false },
    },

    agreementAcceptedAt: { type: Date },

    status: { type: String, enum: RIDER_STATUSES, default: "PENDING", index: true },
    rejectionReason: { type: String },

    isOnline: { type: Boolean, default: false },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    telegram: {
      chatId: { type: String, index: true },
      connectedAt: { type: Date },
    },
    serviceEligibility: {
      delivery: { type: Boolean, default: true },
      medicine: { type: Boolean, default: false },
    },

    rating: { type: Number, default: 5, min: 0, max: 5 },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    completedDeliveries: { type: Number, default: 0 },
    cancellationCount: { type: Number, default: 0 },
    complaintCount: { type: Number, default: 0 },

    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    zoneId: { type: Schema.Types.ObjectId, ref: "Zone" },
  },
  { timestamps: true }
);

riderSchema.index({ status: 1, isOnline: 1, cityId: 1 });

export type RiderDocument = InferSchemaType<typeof riderSchema>;
export const Rider = model("Rider", riderSchema);
