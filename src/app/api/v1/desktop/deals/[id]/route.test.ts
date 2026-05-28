import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getDealDashboardDetailMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/deals", () => ({
  getDealDashboardDetail: getDealDashboardDetailMock,
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/deals/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/deals/deal_1");
    const res = await GET(req, { params: Promise.resolve({ id: "deal_1" }) });

    expect(res.status).toBe(401);
    expect(getDealDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a deal outside the tenant", async () => {
    getDealDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/deals/deal_1");
    const res = await GET(req, { params: Promise.resolve({ id: "deal_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "deals");
    expect(getDealDashboardDetailMock).toHaveBeenCalledWith("biz_1", "deal_1");
  });

  it("returns deal status, windows, pricing, and booking context", async () => {
    getDealDashboardDetailMock.mockResolvedValue({
      deal: {
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
        slotsRedeemed: 2,
        slotsRemaining: 3,
        slotsTotal: 5,
        status: "active",
      },
      location: { id: "location_1", name: "Kandy", timezone: "Asia/Colombo" },
      recentBookings: [
        {
          amountLkr: 2000,
          clientName: "Kasun",
          discountedPriceLkr: 2000,
          id: "booking_1",
          paymentStatus: "success",
          startsAt: "2026-06-01T09:00:00.000Z",
          status: "confirmed",
        },
      ],
      service: {
        depositPercent: 0,
        durationMinutes: 45,
        id: "service_1",
        name: "Haircut",
        priceLkr: 2500,
        requiresPayment: true,
      },
      staff: { id: "staff_1", name: "Ashan" },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/deals/deal_1");
    const res = await GET(req, { params: Promise.resolve({ id: "deal_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/deals");
    expect(body.deal).toMatchObject({ id: "deal_1", displayStatus: "active", slotsRemaining: 3 });
    expect(body.service).toMatchObject({ name: "Haircut", priceLkr: 2500 });
    expect(body.recentBookings).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
