import { Schema, model, InferSchemaType } from "mongoose";

const otpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    purpose: {
      type: String,
      enum: ["LOGIN_OR_REGISTER", "PICKUP_VERIFICATION", "DELIVERY_VERIFICATION"],
      required: true,
    },
    // The OTP is ALWAYS stored hashed (argon2), never plaintext.
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date },
    // Ties a pickup/delivery OTP to a specific order.
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

// TTL index: Mongo automatically deletes expired, unconsumed OTP
// documents. Consumed ones are cleared out promptly too since
// there's no reason to retain used codes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OTPDocument = InferSchemaType<typeof otpSchema>;
export const OTP = model("OTP", otpSchema);
