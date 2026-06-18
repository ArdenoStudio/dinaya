import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const expireMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/booking-expiry", () => ({
  expireAbandonedPayhereBookings: expireMock,
}));

import { GET } from "./route";

describe("GET /api/cron/expire-pending-bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
  });

  it("returns 401 without bearer token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cron/expire-pending-bookings"));
    expect(res.status).toBe(401);
    expect(expireMock).not.toHaveBeenCalled();
  });

  it("expires stale pending PayHere bookings when authorized", async () => {
    expireMock.mockResolvedValue({ expired: 2, checked: 2 });

    const res = await GET(
      new NextRequest("http://localhost/api/cron/expire-pending-bookings", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ expired: 2, checked: 2 });
    expect(expireMock).toHaveBeenCalledOnce();
  });
});
