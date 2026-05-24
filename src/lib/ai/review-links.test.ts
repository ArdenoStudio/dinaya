import { describe, expect, it, vi } from "vitest";
import { createReviewToken, verifyReviewToken } from "./review-links";

describe("signed review links", () => {
  it("round-trips a valid review token", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = createReviewToken({
      bookingId: "11111111-1111-4111-8111-111111111111",
      businessSlug: "demo-salon",
      clientName: "Nimal Perera",
    });

    expect(verifyReviewToken(token)).toMatchObject({
      bookingId: "11111111-1111-4111-8111-111111111111",
      businessSlug: "demo-salon",
      clientName: "Nimal Perera",
    });
    vi.unstubAllEnvs();
  });

  it("rejects tampered tokens", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = createReviewToken({
      bookingId: "11111111-1111-4111-8111-111111111111",
      businessSlug: "demo-salon",
      clientName: "Nimal Perera",
    });

    expect(verifyReviewToken(`${token}x`)).toBeNull();
    vi.unstubAllEnvs();
  });

  it("rejects expired tokens", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = createReviewToken({
      bookingId: "11111111-1111-4111-8111-111111111111",
      businessSlug: "demo-salon",
      clientName: "Nimal Perera",
      expiresInDays: -1,
    });

    expect(verifyReviewToken(token)).toBeNull();
    vi.unstubAllEnvs();
  });
});
