import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getServicesDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/services", () => ({
  getServicesDashboardList: getServicesDashboardListMock,
  isDashboardServiceStatusFilter: (value: string) => ["all", "active", "inactive"].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    getServicesDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          afterBuffer: 5,
          assignedStaffCount: 2,
          beforeBuffer: 10,
          bookingCount: 12,
          createdAt: "2026-05-28T09:00:00.000Z",
          dailyCapacity: null,
          depositPercent: 25,
          description: "Premium cut and finish",
          durationMinutes: 45,
          futureBookingCount: 3,
          id: "service_1",
          isActive: true,
          lastBookingAt: "2026-05-28T10:00:00.000Z",
          minimumNoticeHours: 2,
          name: "Signature cut",
          priceLkr: 3500,
          requiresPayment: true,
        },
      ],
      summary: {
        activeServices: 1,
        averageDurationMinutes: 45,
        averagePriceLkr: 3500,
        inactiveServices: 0,
        paymentRequiredServices: 1,
        totalServices: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/services");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getServicesDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered services with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/services?status=active&q=cut&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getServicesDashboardListMock).toHaveBeenCalledWith("biz_1", {
      limit: 20,
      q: "cut",
      status: "active",
    });
    expect(body.webUrl).toBe("/dashboard/services");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.activeServices).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/services?status=archived");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getServicesDashboardListMock).not.toHaveBeenCalled();
  });
});
