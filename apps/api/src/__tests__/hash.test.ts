import { describe, it, expect } from "vitest";
import { generateNumericCode, hashSecret, verifySecret } from "../utils/hash";

describe("generateNumericCode", () => {
  it("produces a code of the requested length, digits only", () => {
    const code = generateNumericCode(6);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d+$/);
  });

  it("does not always produce the same code", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateNumericCode(6)));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("hashSecret / verifySecret", () => {
  it("verifies a matching plaintext against its hash", async () => {
    const hash = await hashSecret("123456");
    expect(await verifySecret(hash, "123456")).toBe(true);
  });

  it("rejects a non-matching plaintext", async () => {
    const hash = await hashSecret("123456");
    expect(await verifySecret(hash, "000000")).toBe(false);
  });

  it("never stores the plaintext inside the hash output", async () => {
    const hash = await hashSecret("5555");
    expect(hash).not.toContain("5555");
  });

  it("fails closed on a malformed hash instead of throwing", async () => {
    await expect(verifySecret("not-a-real-hash", "5555")).resolves.toBe(false);
  });
});
