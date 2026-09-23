import { Schema, model, InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorType: { type: String, enum: ["ADMIN", "SYSTEM", "RIDER", "CUSTOMER"], required: true },
    actorId: { type: Schema.Types.ObjectId },

    action: { type: String, required: true, index: true }, // e.g. "RIDER_APPROVED", "PRICING_UPDATED"
    targetType: { type: String }, // e.g. "Rider", "Order"
    targetId: { type: Schema.Types.ObjectId, index: true },

    beforeValue: { type: Schema.Types.Mixed },
    afterValue: { type: Schema.Types.Mixed },
    reason: { type: String },

    ipAddress: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

// Never write these into an AuditLog document, even accidentally:
// passwords, OTP codes, JWTs, API secrets, Telegram tokens. Callers
// (auditService) are responsible for stripping them before calling
// AuditLog.create — this schema intentionally has no field named
// for any of them, as a light guardrail.

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = model("AuditLog", auditLogSchema);
