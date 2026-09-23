import { AuditLog } from "../models/AuditLog";

const NEVER_LOG_KEYS = new Set([
  "password",
  "pin",
  "pinHash",
  "otp",
  "code",
  "codeHash",
  "token",
  "accessToken",
  "refreshToken",
  "jwt",
  "telegramBotToken",
  "apiSecret",
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        NEVER_LOG_KEYS.has(k) ? "[redacted]" : redact(v),
      ])
    );
  }
  return value;
}

interface RecordActionInput {
  actorType: "ADMIN" | "SYSTEM" | "RIDER" | "CUSTOMER";
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ipAddress?: string;
}

export async function recordAuditAction(input: RecordActionInput): Promise<void> {
  await AuditLog.create({
    actorType: input.actorType,
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    beforeValue: redact(input.before),
    afterValue: redact(input.after),
    reason: input.reason,
    ipAddress: input.ipAddress,
  });
}
