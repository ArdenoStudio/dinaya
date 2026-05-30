import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getBillingDashboardOverviewMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/billing", () => ({
  getBillingDashboardOverview: getBillingDashboardOverviewMock,
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/billing");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getBillingDashboardOverviewMock).not.toHaveBeenCalled();
  });

  it("returns native billing overview", async () => {
    getBillingDashboardOverviewMock.mockResolvedValue({
      actions: {
        billingPath: "/dashboard/billing",
        contactPath: "/contact",
        managePath: "/dashboard/billing",
        upgradeMaxPath: "/dashboard/billing",
        upgradeProPath: "/dashboard/billing",
        upgradeStarterPath: "/dashboard/billing",
      },
      business: {
        effectivePlan: "pro",
        id: "biz_1",
        name: "Salon",
        planExpiresAt: "2026-06-28T00:00:00.000Z",
        planLabel: "Pro",
        slug: "salon",
        storedPlan: "pro",
      },
      currentSubscription: {
        amountLkr: 3990,
        billingInterval: "monthly",
        cancelledAt: null,
        createdAt: "2026-05-28T09:00:00.000Z",
        currentPeriodEnd: "2026-06-28T09:00:00.000Z",
        id: "sub_1",
        payhereOrderId: "DINAYA-SUB-1",
        payhereSubscriptionId: "PH-1",
        plan: "pro",
        status: "active",
      },
      features: {
        automations: true,
        broadcasts: true,
        deals: true,
        googleCalendarSync: true,
        payments: true,
        reports: true,
        reviewReplies: false,
        voiceReceptionist: false,
        webhooks: true,
      },
      pricing: {
        max: { annualLkr: 69000, annualSavingsPercent: 17, available: true, monthlyLkr: 6900 },
        pro: { annualLkr: 39900, annualSavingsPercent: 17, available: true, monthlyLkr: 3990 },
        starter: { annualLkr: 19900, annualSavingsPercent: 17, available: true, monthlyLkr: 1990 },
      },
      subscriptions: [],
      usage: [
        { key: "locations", label: "Locations", limit: 3, percent: 33, remaining: 2, used: 1 },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/billing");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/billing");
    expect(body.business).toMatchObject({ effectivePlan: "pro", planLabel: "Pro" });
    expect(body.currentSubscription).toMatchObject({ id: "sub_1", status: "active" });
    expect(body.pricing.pro.monthlyLkr).toBe(3990);
    expect(body.serverTime).toEqual(expect.any(String));
    expect(getBillingDashboardOverviewMock).toHaveBeenCalledWith("biz_1");
  });

  it("applies desktop billing rate limit", async () => {
    withRateLimitMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Too many requests" }, { status: 429 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/billing");
    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(getBillingDashboardOverviewMock).not.toHaveBeenCalled();
  });
});
