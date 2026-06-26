import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getLocationsDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/locations", () => ({
  getLocationsDashboardList: getLocationsDashboardListMock,
  isDashboardLocationStatusFilter: (value: string) => ["all", "active", "inactive"].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/locations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    getLocationsDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          address: "Kandy Road",
          bookingCount: 12,
          createdAt: "2026-05-28T09:00:00.000Z",
          futureBookingCount: 3,
          id: "location_1",
          isActive: true,
          isDefault: true,
          lastBookingAt: "2026-05-28T10:00:00.000Z",
          name: "Kandy",
          phone: "0810000000",
          primaryStaffCount: 1,
          slug: "kandy",
          sortOrder: 0,
          staffCount: 2,
          timezone: "Asia/Colombo",
        },
      ],
      summary: {
        activeLocations: 1,
        defaultLocations: 1,
        inactiveLocations: 0,
        totalLocations: 1,
        withAddress: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/locations");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getLocationsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered locations with branch metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/locations?status=active&q=kandy&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getLocationsDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 20,
      q: "kandy",
      status: "active",
    });
    expect(body.webUrl).toBe("/dashboard/locations");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.activeLocations).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/locations?status=archived");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getLocationsDashboardListMock).not.toHaveBeenCalled();
  });
});
