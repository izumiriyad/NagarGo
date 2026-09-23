import argon2 from "argon2";
import crypto from "node:crypto";

/**
 * Used for: admin PIN, OTP codes. Never used for anything we need
 * to recover later — hashing is one-way by design.
 */
export async function hashSecret(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifySecret(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed hash should fail closed, not throw past the caller.
    return false;
  }
}

/**
 * Cryptographically random numeric code generator for OTPs.
 * Avoids Math.random(), which is not safe for anything
 * security-sensitive.
 */
export function generateNumericCode(length: number): string {
  const digits = "0123456789";
  let code = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i]! % digits.length];
  }
  return code;
}

export function generateOpaqueToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}
