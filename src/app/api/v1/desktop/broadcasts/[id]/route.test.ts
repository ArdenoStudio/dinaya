import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getBroadcastDashboardDetailMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/broadcasts", () => ({
  getBroadcastDashboardDetail: getBroadcastDashboardDetailMock,
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/broadcasts/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/broadcasts/broadcast_1");
    const res = await GET(req, { params: Promise.resolve({ id: "broadcast_1" }) });

    expect(res.status).toBe(401);
    expect(getBroadcastDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a broadcast outside the tenant", async () => {
    getBroadcastDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/broadcasts/broadcast_1");
    const res = await GET(req, { params: Promise.resolve({ id: "broadcast_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "broadcasts");
    expect(getBroadcastDashboardDetailMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "broadcast_1");
  });

  it("returns broadcast audience and result summary", async () => {
    getBroadcastDashboardDetailMock.mockResolvedValue({
      audience: {
        cappedRecipientCount: 2,
        eligibleRecipientCount: 2,
        filter: { stage: "active" },
        label: "Stage: active",
        sampleRecipients: [
          { email: "kasun@example.com", id: "client_1", name: "Kasun", phone: "0770000000", tags: ["vip"] },
        ],
        type: "stage",
      },
      broadcast: {
        audienceFilter: { stage: "active" },
        audienceType: "stage",
        body: "This week's offer",
        channel: "email",
        createdAt: "2026-05-28T09:00:00.000Z",
        failedCount: 0,
        id: "broadcast_1",
        name: "May promo",
        recipientCount: 2,
        sentAt: "2026-05-28T09:05:00.000Z",
        sentCount: 2,
        skippedCount: 0,
        status: "sent",
        subject: "Offer",
        updatedAt: "2026-05-28T09:05:00.000Z",
      },
      results: {
        deliveryRatePercent: 100,
        failureRatePercent: 0,
        remainingCount: 0,
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/broadcasts/broadcast_1");
    const res = await GET(req, { params: Promise.resolve({ id: "broadcast_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/broadcasts");
    expect(body.broadcast).toMatchObject({ id: "broadcast_1", status: "sent", sentCount: 2 });
    expect(body.audience).toMatchObject({ label: "Stage: active", eligibleRecipientCount: 2 });
    expect(body.results.deliveryRatePercent).toBe(100);
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
