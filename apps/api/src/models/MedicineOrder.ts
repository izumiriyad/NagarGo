import { Schema, model, InferSchemaType } from "mongoose";
import { generatePublicId } from "../utils/idGenerator";

const medicineOrderSchema = new Schema({
  publicId: { type: String, unique: true, index: true, default: () => generatePublicId("NGM") },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  riderId: { type: Schema.Types.ObjectId, ref: "Rider", index: true },
  cityId: { type: Schema.Types.ObjectId, ref: "City", required: true },
  pickup: { pharmacyName: String, pharmacyAddress: String, lat: Number, lng: Number },
  destination: { fullAddress: { type: String, required: true }, lat: Number, lng: Number },
  prescriptionUrl: { type: String },
  items: [{ name: String, quantity: Number, notes: String }],
  receiptUrl: String,
  pharmacyVerified: { type: Boolean, default: false },
  adminReviewNote: String,
  status: { type: String, enum: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "DISPUTED"], default: "SUBMITTED", index: true },
  pricing: { deliveryFee: Number, medicineSubtotal: Number, total: Number },
  paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
}, { timestamps: true });

medicineOrderSchema.index({ status: 1, createdAt: -1 });
export type MedicineOrderDocument = InferSchemaType<typeof medicineOrderSchema>;
export const MedicineOrder = model("MedicineOrder", medicineOrderSchema);
