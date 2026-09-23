import { Request, Response } from "express";
import { z } from "zod";
import { AdminAccount } from "../models/AdminAccount";
import { hashSecret, verifySecret } from "../utils/hash";
import { signAccessToken, signRefreshToken } from "../services/jwtService";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { recordAuditAction } from "../services/auditService";
import { telegramService } from "../services/telegramService";

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Ensures exactly one bootstrap admin account exists, seeded from
 * ADMIN_BOOTSTRAP_PIN. The PIN is hashed before it ever touches the
 * database — "5555" (or whatever value is configured) is never
 * stored, logged, or returned in plaintext anywhere, including
 * here. Call this once at server startup.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  if (!env.ADMIN_BOOTSTRAP_ENABLED) return;

  const existingCount = await AdminAccount.countDocuments();
  if (existingCount > 0) return;

  const pinHash = await hashSecret(env.ADMIN_BOOTSTRAP_PIN);
  await AdminAccount.create({
    name: "Super Admin",
    pinHash,
    mustChangePin: true,
    isBootstrapAccount: true,
    role: "SUPER_ADMIN",
  });

  console.log(
    "[admin] Bootstrap admin account created. Log in with the bootstrap PIN from your .env " +
      "and change it immediately — this bootstrap account is meant for first-run setup only."
  );
}

const loginSchema = z.object({ pin: z.string().min(4).max(12) });

export async function adminLogin(req: Request, res: Response) {
  const { pin } = loginSchema.parse(req.body);

  // Deliberately vague: never reveal whether "no admin exists yet"
  // vs "wrong pin" vs "account locked" in a way that helps an
  // attacker enumerate state, beyond what's operationally necessary.
  const admin = await AdminAccount.findOne({ status: "ACTIVE" }).sort({ createdAt: 1 });
  if (!admin) {
    throw new AppError("Invalid PIN.", 401);
  }

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    throw new AppError("Too many failed attempts. Try again later.", 423);
  }

  const isValid = await verifySecret(admin.pinHash, pin);

  if (!isValid) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= LOCK_THRESHOLD) {
      admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      telegramService.events.securityAlert({
        event: "ADMIN_ACCOUNT_LOCKED",
        detail: `Locked after ${LOCK_THRESHOLD} failed PIN attempts.`,
      });
    }
    await admin.save();
    throw new AppError("Invalid PIN.", 401);
  }

  admin.failedLoginAttempts = 0;
  admin.lockedUntil = undefined;
  admin.lastLoginAt = new Date();
  await admin.save();

  const payload = { sub: String(admin._id), role: "ADMIN" as const, sessionVersion: admin.sessionVersion };

  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    mustChangePin: admin.mustChangePin,
    admin: { id: admin._id, name: admin.name, role: admin.role },
  });
}

const changePinSchema = z.object({
  currentPin: z.string().min(4).max(12),
  newPin: z.string().min(4).max(12),
});

export async function changeAdminPin(req: Request, res: Response) {
  const { currentPin, newPin } = changePinSchema.parse(req.body);
  const adminId = req.auth!.sub;

  const admin = await AdminAccount.findById(adminId);
  if (!admin) throw new AppError("Admin account not found.", 404);

  const isValid = await verifySecret(admin.pinHash, currentPin);
  if (!isValid) throw new AppError("Current PIN is incorrect.", 401);

  if (newPin === env.ADMIN_BOOTSTRAP_PIN) {
    throw new AppError("Please choose a PIN different from the bootstrap default.", 400);
  }

  admin.pinHash = await hashSecret(newPin);
  admin.mustChangePin = false;
  admin.isBootstrapAccount = false;
  await admin.save();

  await recordAuditAction({
    actorType: "ADMIN",
    actorId: String(admin._id),
    action: "ADMIN_PIN_CHANGED",
    targetType: "AdminAccount",
    targetId: String(admin._id),
  });

  res.json({ message: "PIN updated successfully." });
}

/** Invalidates every previously issued admin JWT by bumping sessionVersion. */
export async function logoutAllAdminSessions(req: Request, res: Response) {
  const adminId = req.auth!.sub;
  const admin = await AdminAccount.findById(adminId);
  if (!admin) throw new AppError("Admin account not found.", 404);

  admin.sessionVersion += 1;
  await admin.save();

  await recordAuditAction({
    actorType: "ADMIN",
    actorId: String(admin._id),
    action: "ADMIN_LOGOUT_ALL_SESSIONS",
  });

  res.json({ message: "All admin sessions have been logged out." });
}
