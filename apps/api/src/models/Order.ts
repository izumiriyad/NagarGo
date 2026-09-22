import { Schema, model, InferSchemaType } from "mongoose";
import { generatePublicId } from "../utils/idGenerator";

export const ORDER_STATES = [
  "CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_SUBMITTED",
  "PAYMENT_VERIFICATION_PENDING",
  "PAYMENT_CONFIRMED",
  "SEARCHING_RIDER",
  "RIDER_ASSIGNED",
  "RIDER_ACCEPTED",
  "RIDER_ARRIVING",
  "RIDER_AT_PICKUP",
  "PICKUP_OTP_PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "RIDER_AT_DESTINATION",
  "DELIVERY_OTP_PENDING",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "DISPUTED",
] as const;

export type OrderState = (typeof ORDER_STATES)[number];

// Legal transitions out of each state. Any transition not listed
// here is rejected server-side — the frontend cannot arbitrarily
// set order status (see services/orderStateMachine.ts consumer in
// orderController).
export const ORDER_TRANSITIONS: Record<OrderState, OrderState[]> = {
  CREATED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_SUBMITTED: ["PAYMENT_VERIFICATION_PENDING", "CANCELLED"],
  PAYMENT_VERIFICATION_PENDING: ["PAYMENT_CONFIRMED", "PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_CONFIRMED: ["SEARCHING_RIDER", "CANCELLED"],
  SEARCHING_RIDER: ["RIDER_ASSIGNED", "CANCELLED", "FAILED"],
  RIDER_ASSIGNED: ["RIDER_ACCEPTED", "SEARCHING_RIDER", "CANCELLED"],
  RIDER_ACCEPTED: ["RIDER_ARRIVING", "CANCELLED"],
  RIDER_ARRIVING: ["RIDER_AT_PICKUP", "CANCELLED"],
  RIDER_AT_PICKUP: ["PICKUP_OTP_PENDING", "CANCELLED"],
  PICKUP_OTP_PENDING: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["RIDER_AT_DESTINATION", "DISPUTED"],
  RIDER_AT_DESTINATION: ["DELIVERY_OTP_PENDING"],
  DELIVERY_OTP_PENDING: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["DISPUTED"],
  CANCELLED: [],
  FAILED: [],
  DISPUTED: ["DELIVERED", "CANCELLED"],
};

const orderSchema = new Schema(
  {
    publicId: { type: String, unique: true, index: true, default: () => generatePublicId("NG") },

    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    riderId: { type: Schema.Types.ObjectId, ref: "Rider", index: true },
    dispatchAttempts: [{ riderId: { type: Schema.Types.ObjectId, ref: "Rider" }, assignedAt: { type: Date, default: Date.now }, outcome: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED", "TIMEOUT"] } }],
    cityId: { type: Schema.Types.ObjectId, ref: "City", required: true },

    pickup: {
      area: String,
      fullAddress: { type: String, required: true },
      landmark: String,
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    destination: {
      area: String,
      fullAddress: { type: String, required: true },
      landmark: String,
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    item: {
      category: { type: String, required: true },
      name: { type: String, required: true },
      description: String,
      quantity: { type: Number, default: 1 },
      approxWeightKg: Number,
      approxSize: String,
      photoUrl: String,
      specialInstructions: String,
    },

    isEmergency: { type: Boolean, default: false },

    // All monetary fields below are computed server-side by
    // pricingService and are never accepted from the client.
    pricing: {
      distanceKm: { type: Number, required: true },
      estimatedMinutes: { type: Number, required: true },
      baseFare: { type: Number, required: true },
      distanceFare: { type: Number, required: true },
      serviceFee: { type: Number, required: true },
      surcharges: { type: Number, default: 0 },
      total: { type: Number, required: true },
      riderEarnings: { type: Number, required: true },
      nagarGoCommission: { type: Number, required: true },
    },

    status: { type: String, enum: ORDER_STATES, default: "CREATED", index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATES },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],

    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    pickupOtpVerifiedAt: { type: Date },
    deliveryOtpVerifiedAt: { type: Date },

    cancelledBy: { type: String, enum: ["CUSTOMER", "RIDER", "ADMIN"] },
    cancellationReason: { type: String },

    ratedByCustomer: { type: Boolean, default: false },
    ratedByRider: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ riderId: 1, status: 1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const Order = model("Order", orderSchema);
