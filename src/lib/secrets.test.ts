import { describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "./secrets";

describe("secrets", () => {
  it("encrypts and decrypts values", () => {
    vi.stubEnv("SECRET_ENCRYPTION_KEY", "test-encryption-key");
    const encrypted = encryptSecret("merchant-secret");
    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(decryptSecret(encrypted)).toBe("merchant-secret");
    vi.unstubAllEnvs();
  });

  it("returns legacy plaintext values unchanged", () => {
    expect(decryptSecret("legacy-plaintext")).toBe("legacy-plaintext");
    expect(isEncryptedSecret("legacy-plaintext")).toBe(false);
  });

  it("throws when encryption key is missing", () => {
    vi.stubEnv("SECRET_ENCRYPTION_KEY", "");
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => encryptSecret("value")).toThrow(/SECRET_ENCRYPTION_KEY or AUTH_SECRET/);
    vi.unstubAllEnvs();
  });
});
