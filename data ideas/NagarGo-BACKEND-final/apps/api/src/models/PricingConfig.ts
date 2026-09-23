import { Schema, model, InferSchemaType } from "mongoose";

const pricingConfigSchema = new Schema(
  {
    cityId: { type: Schema.Types.ObjectId, ref: "City", required: true, unique: true },

    baseFare: { type: Number, required: true, default: 20 },
    perKmRate: { type: Number, required: true, default: 15 },
    minimumFare: { type: Number, required: true, default: 40 },
    serviceFee: { type: Number, required: true, default: 5 },
    waitingFeePerMinute: { type: Number, required: true, default: 1 },
    cancellationFee: { type: Number, required: true, default: 10 },
    peakMultiplier: { type: Number, required: true, default: 1.2 },
    emergencyMultiplier: { type: Number, required: true, default: 1.5 },

    riderCommissionPercent: { type: Number, required: true, default: 80 },
    nagarGoCommissionPercent: { type: Number, required: true, default: 20 },

    isPeakActive: { type: Boolean, default: false },

    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminAccount" },
  },
  { timestamps: true }
);

pricingConfigSchema.pre("validate", function (next) {
  if (this.riderCommissionPercent + this.nagarGoCommissionPercent !== 100) {
    next(new Error("riderCommissionPercent + nagarGoCommissionPercent must equal 100"));
    return;
  }
  next();
});

export type PricingConfigDocument = InferSchemaType<typeof pricingConfigSchema>;
export const PricingConfig = model("PricingConfig", pricingConfigSchema);
