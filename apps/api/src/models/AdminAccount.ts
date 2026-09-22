import { Schema, model, InferSchemaType } from "mongoose";

const adminAccountSchema = new Schema(
  {
    name: { type: String, required: true },
    // The PIN is NEVER stored in plaintext, including the initial
    // bootstrap PIN — it is hashed before this document is saved.
    // See services/otpService.ts-adjacent bootstrap logic in
    // controllers/adminAuthController.ts.
    pinHash: { type: String, required: true },
    mustChangePin: { type: Boolean, default: true },
    isBootstrapAccount: { type: Boolean, default: false },

    role: { type: String, enum: ["SUPER_ADMIN", "ADMIN"], default: "ADMIN" },
    status: { type: String, enum: ["ACTIVE", "DISABLED"], default: "ACTIVE" },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },

    // Bumping this invalidates all previously issued admin JWTs —
    // used by "log out all sessions".
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type AdminAccountDocument = InferSchemaType<typeof adminAccountSchema>;
export const AdminAccount = model("AdminAccount", adminAccountSchema);
