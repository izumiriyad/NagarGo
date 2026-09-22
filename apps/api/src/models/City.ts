import { Schema, model } from "mongoose";

const citySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  country: { type: String, default: "Bangladesh" },
  currency: { type: String, default: "BDT" },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const City = model("City", citySchema);
