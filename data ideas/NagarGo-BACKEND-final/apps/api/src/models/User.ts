import { Schema, model, InferSchemaType } from "mongoose";
import { generatePublicId } from "../utils/idGenerator";

const userSchema = new Schema(
  {
    publicId: { type: String, unique: true, index: true, default: () => generatePublicId("NGU") },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },
    passwordHash: { type: String, select: false },
    profileImageUrl: { type: String },
    location: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },

    role: { type: String, enum: ["CUSTOMER"], default: "CUSTOMER" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE", index: true },

    isPhoneVerified: { type: Boolean, default: false },

    savedAddresses: [
      {
        label: { type: String, enum: ["HOME", "WORK", "OTHER"], default: "OTHER" },
        customLabel: { type: String },
        address: { type: String, required: true },
        landmark: { type: String },
        lat: { type: Number },
        lng: { type: Number },
      },
    ],

    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },

    cityId: { type: Schema.Types.ObjectId, ref: "City" },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
