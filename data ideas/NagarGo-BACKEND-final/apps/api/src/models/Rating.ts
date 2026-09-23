import { Schema, model } from "mongoose";
const ratingSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  riderId: { type: Schema.Types.ObjectId, ref: "Rider", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
}, { timestamps: true });
export const Rating = model("Rating", ratingSchema);
