import { describe, expect, it } from "vitest";
import { createClientBookingToken, verifyClientBookingToken } from "./client-tokens";

describe("client booking tokens", () => {
  it("round-trips a valid token", () => {
    process.env.AUTH_SECRET = "test-secret-for-client-tokens";

    const token = createClientBookingToken({
      bookingId: "00000000-0000-4000-8000-000000000001",
      clientPhone: "94771234567",
    });

    const parsed = verifyClientBookingToken(token);
    expect(parsed?.bookingId).toBe("00000000-0000-4000-8000-000000000001");
    expect(parsed?.clientPhone).toBe("94771234567");
  });

  it("rejects tampered tokens", () => {
    process.env.AUTH_SECRET = "test-secret-for-client-tokens";

    const token = createClientBookingToken({
      bookingId: "00000000-0000-4000-8000-000000000001",
      clientPhone: "94771234567",
    });

    expect(verifyClientBookingToken(`${token}x`)).toBeNull();
  });
});
