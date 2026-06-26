import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getDealsDashboardListMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/deals", () => ({
  getDealsDashboardList: getDealsDashboardListMock,
  isDashboardDealStatusFilter: (value: string) => ["all", "active", "upcoming", "sold_out", "expired", "cancelled"].includes(value),
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/deals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    getDealsDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          apptWindowEnd: "2026-06-01T17:00:00.000Z",
          apptWindowStart: "2026-06-01T09:00:00.000Z",
          conversionPercent: 25,
          createdAt: "2026-05-28T09:00:00.000Z",
          dealWindowEnd: "2026-05-30T09:00:00.000Z",
          dealWindowStart: "2026-05-28T09:00:00.000Z",
          discountPercent: 20,
          discountedPriceLkr: 2000,
          displayStatus: "active",
          id: "deal_1",
          impressionCount: 8,
          locationId: "location_1",
          locationName: "Kandy",
          serviceId: "service_1",
          serviceName: "Haircut",
          servicePriceLkr: 2500,
          slotsRedeemed: 2,
          slotsRemaining: 3,
          slotsTotal: 5,
          staffId: "staff_1",
          staffName: "Ashan",
          status: "active",
        },
      ],
      summary: {
        activeDeals: 1,
        cancelledDeals: 0,
        expiredDeals: 0,
        impressions: 8,
        redeemedSlots: 2,
        soldOutDeals: 0,
        totalDeals: 1,
        upcomingDeals: 0,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/deals");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getDealsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered deals with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/deals?status=active&q=haircut&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "deals");
    expect(getDealsDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 20,
      q: "haircut",
      status: "active",
    });
    expect(body.webUrl).toBe("/dashboard/deals");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.redeemedSlots).toBe(2);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/deals?status=draft");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getDealsDashboardListMock).not.toHaveBeenCalled();
  });
});
