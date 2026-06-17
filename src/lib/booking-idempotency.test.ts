import { describe, expect, it } from "vitest";
import {
  hashBookingIdempotencyPayload,
  resolveBookingIdempotencyKey,
} from "@/lib/booking-idempotency";

describe("booking idempotency", () => {
  it("prefers the Idempotency-Key header", () => {
    expect(resolveBookingIdempotencyKey("booking-abc", "session-token-1234567890")).toBe("booking-abc");
  });

  it("falls back to the browser session token", () => {
    expect(resolveBookingIdempotencyKey(null, "session-token-1234567890")).toBe(
      "session:session-token-1234567890",
    );
  });

  it("hashes booking payloads deterministically", () => {
    const payload = {
      businessId: "11111111-1111-4111-8111-111111111111",
      serviceId: "22222222-2222-4222-8222-222222222222",
      staffId: "33333333-3333-4333-8333-333333333333",
      startsAt: "2026-06-16T09:00:00.000Z",
      endsAt: "2026-06-16T09:30:00.000Z",
      clientPhone: "+94771234567",
    };

    expect(hashBookingIdempotencyPayload(payload)).toHaveLength(64);
    expect(hashBookingIdempotencyPayload(payload)).toBe(hashBookingIdempotencyPayload(payload));
  });
});
