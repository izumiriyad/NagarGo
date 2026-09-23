import crypto from "node:crypto";

export type EntityPrefix = "NGU" | "NGR" | "NG" | "NGM";

/**
 * Generates human-readable public IDs like NGU-7F3K2Q, used in
 * customer-facing UI, receipts, and Telegram notifications.
 * The Mongo _id remains the real primary key; this is a display
 * and lookup convenience field, indexed separately.
 */
export function generatePublicId(prefix: EntityPrefix): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `${prefix}-${suffix}`;
}
