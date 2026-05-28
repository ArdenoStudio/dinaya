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

function makeBusinessQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };
  return query;
}

function makeStaffQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(async () => result),
  };
  return query;
}

function makeCalendarRowsQuery(result: unknown) {
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

describe("GET /api/v1/desktop/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopBookingsMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopBookingsMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/calendar");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed date param", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/calendar?date=bad-date");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("YYYY-MM-DD");
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("returns a day calendar payload", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeBusinessQuery([{ timezone: "Asia/Colombo" }]))
      .mockReturnValueOnce(makeStaffQuery([
        { id: "st_1", isActive: true, name: "Ashan" },
      ]))
      .mockReturnValueOnce(makeCalendarRowsQuery([
        {
          id: "bk_1",
          clientName: "Kasun",
          clientPhone: "+94770000000",
          clientEmail: "kasun@example.com",
          startsAt: new Date("2026-05-26T09:00:00.000Z"),
          endsAt: new Date("2026-05-26T09:45:00.000Z"),
          status: "confirmed",
          createdAt: new Date("2026-05-26T08:00:00.000Z"),
          serviceName: "Haircut",
          staffId: "st_1",
          staffName: "Ashan",
          locationName: "Kandy",
        },
      ]));

    const req = new NextRequest("http://localhost/api/v1/desktop/calendar?date=2026-05-26");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.view).toBe("day");
    expect(body.date).toBe("2026-05-26");
    expect(body.days).toHaveLength(1);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0]).toMatchObject({
      id: "bk_1",
      clientName: "Kasun",
      locationName: "Kandy",
      serviceName: "Haircut",
      staffName: "Ashan",
      status: "confirmed",
    });
  });

  it("returns seven day buckets for week view", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeBusinessQuery([{ timezone: "Asia/Colombo" }]))
      .mockReturnValueOnce(makeStaffQuery([]))
      .mockReturnValueOnce(makeCalendarRowsQuery([]));

    const req = new NextRequest("http://localhost/api/v1/desktop/calendar?view=week&date=2026-05-28&staffId=st_1");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.view).toBe("week");
    expect(body.days).toHaveLength(7);
    expect(body.days[0].date).toBe("2026-05-25");
    expect(body.rows).toEqual([]);
  });
});
