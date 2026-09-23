import { Schema, model } from "mongoose";
const featureFlagSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  description: String,
  updatedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminAccount" },
}, { timestamps: true });
export const FeatureFlag = model("FeatureFlag", featureFlagSchema);
