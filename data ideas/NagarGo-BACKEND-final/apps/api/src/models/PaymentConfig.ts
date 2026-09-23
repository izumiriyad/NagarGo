import { Schema, model, InferSchemaType } from "mongoose";
import { env } from "../config/env";

const paymentConfigSchema = new Schema(
  {
    // Singleton document — there is exactly one active PaymentConfig.
    key: { type: String, default: "default", unique: true },

    codEnabled: { type: Boolean, default: true },
    payRiderEnabled: { type: Boolean, default: true },
    payAdminEnabled: { type: Boolean, default: true },

    adminBkash: {
      number: { type: String, default: env.ADMIN_BKASH_NUMBER },
      accountType: { type: String, default: env.ADMIN_BKASH_ACCOUNT_TYPE },
      instruction: { type: String, default: env.ADMIN_BKASH_INSTRUCTION },
      displayName: { type: String, default: "NagarGo Admin" },
    },

    minimumPayment: { type: Number, default: 0 },

    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminAccount" },
  },
  { timestamps: true }
);

export type PaymentConfigDocument = InferSchemaType<typeof paymentConfigSchema>;
export const PaymentConfig = model("PaymentConfig", paymentConfigSchema);

/** Fetches the singleton config, creating it with defaults on first run. */
export async function getOrCreatePaymentConfig() {
  const existing = await PaymentConfig.findOne({ key: "default" });
  if (existing) return existing;
  return PaymentConfig.create({ key: "default" });
}
