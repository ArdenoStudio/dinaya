import { describe, expect, it, vi } from "vitest";
import { createImpersonationToken, verifyImpersonationToken } from "./impersonation";

describe("impersonation tokens", () => {
  it("creates and verifies a short-lived token", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = createImpersonationToken({
      userId: "user-1",
      adminEmail: "admin@dinaya.lk",
      expiresInMinutes: 5,
    });
    const payload = verifyImpersonationToken(token);
    expect(payload?.userId).toBe("user-1");
    expect(payload?.adminEmail).toBe("admin@dinaya.lk");
    vi.unstubAllEnvs();
  });
});
