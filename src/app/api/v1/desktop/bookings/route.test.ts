import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopBookingsMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopBookings: requireDesktopBookingsMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
  },
}));

import { GET } from "./route";

function makeLimitQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };
  return query;
}

function makeBookingsQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    innerJoin: vi.fn(() => query),
    leftJoin: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };
  return query;
}

describe("GET /api/v1/desktop/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopBookingsMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/bookings");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed since param", async () => {
    requireDesktopBookingsMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/bookings?since=bad");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("since");
  });

  it("returns compact rows and cursor", async () => {
    requireDesktopBookingsMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });

    dbSelectMock
      .mockReturnValueOnce(makeLimitQuery([{ timezone: "Asia/Colombo" }]))
      .mockReturnValueOnce(makeBookingsQuery([
        {
          id: "bk_1",
          clientId: null,
          clientName: "Kasun",
          clientPhone: "+94770000000",
          clientEmail: "kasun@example.com",
          startsAt: new Date("2026-05-26T09:00:00.000Z"),
          endsAt: new Date("2026-05-26T09:45:00.000Z"),
          status: "confirmed",
          source: "online",
          createdAt: new Date("2026-05-26T08:00:00.000Z"),
          amountLkr: 2500,
          paymentStatus: "success",
          serviceName: "Haircut",
          staffId: "st_1",
          staffName: "Ashan",
        },
      ]));

    const req = new NextRequest("http://localhost/api/v1/desktop/bookings?tab=today&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0]).toMatchObject({
      id: "bk_1",
      clientName: "Kasun",
      serviceName: "Haircut",
      staffName: "Ashan",
      status: "confirmed",
    });
    expect(body.nextCursor).toBeNull();
  });
});
