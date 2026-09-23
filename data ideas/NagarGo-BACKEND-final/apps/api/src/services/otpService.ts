import { OTP } from "../models/OTP";
import { env } from "../config/env";
import { generateNumericCode, hashSecret, verifySecret } from "../utils/hash";
import { AppError } from "../middleware/errorHandler";

type OtpPurpose = "LOGIN_OR_REGISTER" | "PICKUP_VERIFICATION" | "DELIVERY_VERIFICATION";

/**
 * Issues a new OTP for a phone number + purpose. The plaintext
 * code is returned ONLY to the caller in-process (e.g. to display
 * inside the NagarGo app UI, per the MVP's non-SMS design) — it is
 * never logged, never included in any API response body that
 * isn't the immediate, explicitly-designed "show code in app" UI
 * flow, and never sent to Telegram.
 */
export async function issueOtp(phone: string, purpose: OtpPurpose, orderId?: string) {
  const recentUnexpired = await OTP.findOne({
    phone,
    purpose,
    consumedAt: { $exists: false },
    createdAt: { $gt: new Date(Date.now() - env.OTP_RESEND_COOLDOWN_SECONDS * 1000) },
  }).sort({ createdAt: -1 });

  if (recentUnexpired) {
    throw new AppError(
      `Please wait before requesting another code.`,
      429
    );
  }

  const code = generateNumericCode(env.OTP_LENGTH);
  const codeHash = await hashSecret(code);

  await OTP.create({
    phone,
    purpose,
    codeHash,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    expiresAt: new Date(Date.now() + env.OTP_TTL_SECONDS * 1000),
    orderId,
  });

  return { code, expiresInSeconds: env.OTP_TTL_SECONDS };
}

export async function verifyOtp(phone: string, purpose: OtpPurpose, submittedCode: string) {
  const otp = await OTP.findOne({
    phone,
    purpose,
    consumedAt: { $exists: false },
  }).sort({ createdAt: -1 });

  if (!otp) {
    throw new AppError("No active code found. Please request a new one.", 400);
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    throw new AppError("This code has expired. Please request a new one.", 400);
  }

  if (otp.attempts >= otp.maxAttempts) {
    throw new AppError("Too many incorrect attempts. Please request a new code.", 429);
  }

  const isValid = await verifySecret(otp.codeHash, submittedCode);

  if (!isValid) {
    otp.attempts += 1;
    await otp.save();
    throw new AppError("Incorrect code. Please try again.", 400);
  }

  otp.consumedAt = new Date();
  await otp.save();

  return true;
}
