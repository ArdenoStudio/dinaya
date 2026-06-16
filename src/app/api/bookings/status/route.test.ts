import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const selectMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: selectMock,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

import { GET } from "./route";

function mockStatusRows(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const leftJoin = vi.fn(() => ({ where }));
  const innerJoin = vi.fn(() => ({ leftJoin }));
  const from = vi.fn(() => ({ innerJoin }));
  selectMock.mockReturnValue({ from });
}

describe("GET /api/bookings/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
  });

  it("returns a rate limit response", async () => {
    withRateLimitMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Too many requests" }, { status: 429 }),
    });

    const req = new NextRequest(
      "http://localhost/api/bookings/status?bookingId=11111111-1111-4111-8111-111111111111&slug=salon",
    );
    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("rejects malformed requests", async () => {
    const req = new NextRequest("http://localhost/api/bookings/status?bookingId=nope&slug=salon");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid booking status request.");
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the booking does not match the slug", async () => {
    mockStatusRows([]);

    const req = new NextRequest(
      "http://localhost/api/bookings/status?bookingId=11111111-1111-4111-8111-111111111111&slug=salon",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Booking not found.");
  });

  it("returns booking and payment status without client details", async () => {
    mockStatusRows([{ bookingStatus: "confirmed", paymentStatus: "success" }]);

    const req = new NextRequest(
      "http://localhost/api/bookings/status?bookingId=11111111-1111-4111-8111-111111111111&slug=salon",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      bookingStatus: "confirmed",
      confirmed: true,
      paymentStatus: "success",
      pending: false,
    });
    expect(body.clientName).toBeUndefined();
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
