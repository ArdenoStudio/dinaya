import { describe, expect, it } from "vitest";
import { isCredentialsCallbackPath, normalizeCredentialsEmail } from "./auth-rate-limit";

describe("auth rate-limit helpers", () => {
  it("matches only the credentials callback route", () => {
    expect(isCredentialsCallbackPath("/api/auth/callback/credentials")).toBe(true);
    expect(isCredentialsCallbackPath("/api/auth/signout")).toBe(false);
    expect(isCredentialsCallbackPath("/api/auth/session")).toBe(false);
  });

  it("normalizes credential emails for throttling keys", () => {
    expect(normalizeCredentialsEmail(" OWNER@Example.COM ")).toBe("owner@example.com");
    expect(normalizeCredentialsEmail(null)).toBeNull();
    expect(normalizeCredentialsEmail("not-an-email")).toBeNull();
  });
});
