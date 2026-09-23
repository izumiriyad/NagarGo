import { Schema, model } from "mongoose";
const contentSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  title: String,
  body: String,
  locale: { type: String, enum: ["en", "bn"], default: "en" },
  published: { type: Boolean, default: false },
  updatedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminAccount" },
}, { timestamps: true });
export const Content = model("Content", contentSchema);
