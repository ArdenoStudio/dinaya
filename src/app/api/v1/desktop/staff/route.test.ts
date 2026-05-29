import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getStaffDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/staff", () => ({
  getStaffDashboardList: getStaffDashboardListMock,
  isDashboardStaffStatusFilter: (value: string) => ["all", "active", "inactive"].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    getStaffDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          assignedLocationsCount: 1,
          assignedServicesCount: 3,
          availabilityWindowCount: 5,
          avatarUrl: null,
          bio: "Senior stylist",
          createdAt: "2026-05-28T09:00:00.000Z",
          futureBookingCount: 4,
          id: "staff_1",
          isActive: true,
          lastBookingAt: "2026-05-28T10:00:00.000Z",
          locationIds: ["location_1"],
          name: "Ashan",
          primaryLocationName: "Kandy",
          todayBookingCount: 2,
        },
      ],
      summary: {
        activeStaff: 1,
        inactiveStaff: 0,
        totalStaff: 1,
        withBio: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/staff");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getStaffDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered staff with assignment metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/staff?status=active&q=ashan&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getStaffDashboardListMock).toHaveBeenCalledWith("biz_1", {
      limit: 20,
      q: "ashan",
      status: "active",
    });
    expect(body.webUrl).toBe("/dashboard/staff");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.activeStaff).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/staff?status=archived");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getStaffDashboardListMock).not.toHaveBeenCalled();
  });
});
