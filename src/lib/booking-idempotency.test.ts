import { describe, expect, it, vi } from "vitest";

const selectMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const hasPublicTableMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: selectMock,
    delete: deleteMock,
    insert: insertMock,
  },
}));

vi.mock("@/lib/dashboard/db-compat", () => ({
  hasPublicTable: hasPublicTableMock,
}));

import {
  getBookingIdempotencyResponse,
  hashBookingIdempotencyPayload,
  resolveBookingIdempotencyKey,
  storeBookingIdempotencyResponse,
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

  it("returns cached response for matching idempotency keys", async () => {
    hasPublicTableMock.mockResolvedValue(true);
    deleteMock.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    const limit = vi.fn().mockResolvedValue([
      {
        requestHash: "abc123",
        responseStatus: 200,
        responseBody: { bookingId: "booking-1" },
      },
    ]);
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    selectMock.mockReturnValue({ from });

    const result = await getBookingIdempotencyResponse({
      businessId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "idem-1",
      requestHash: "abc123",
    });

    expect(result).toEqual({ status: 200, body: { bookingId: "booking-1" } });
  });

  it("returns 409 when the same idempotency key is reused with different payload", async () => {
    hasPublicTableMock.mockResolvedValue(true);
    deleteMock.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    const limit = vi.fn().mockResolvedValue([
      {
        requestHash: "different-hash",
        responseStatus: 200,
        responseBody: { bookingId: "booking-1" },
      },
    ]);
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    selectMock.mockReturnValue({ from });

    const result = await getBookingIdempotencyResponse({
      businessId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "idem-1",
      requestHash: "abc123",
    });

    expect(result).toEqual({
      status: 409,
      body: { error: "Idempotency key was already used with different booking details." },
    });
  });

  it("stores idempotency responses for replay", async () => {
    hasPublicTableMock.mockResolvedValue(true);
    deleteMock.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    insertMock.mockReturnValue({ values });

    await storeBookingIdempotencyResponse({
      businessId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: "idem-1",
      requestHash: "abc123",
      responseStatus: 200,
      responseBody: { bookingId: "booking-1" },
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "11111111-1111-4111-8111-111111111111",
        idempotencyKey: "idem-1",
        requestHash: "abc123",
        responseStatus: 200,
        responseBody: { bookingId: "booking-1" },
      }),
    );
  });
});
