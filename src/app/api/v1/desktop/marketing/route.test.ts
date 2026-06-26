import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getMarketingDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/marketing", () => ({
  getMarketingDashboardList: getMarketingDashboardListMock,
  isDashboardMarketingStatusFilter: (value: string) => [
    "all",
    "tools",
    "draft",
    "approved",
    "published",
    "failed",
  ].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/marketing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    getMarketingDashboardListMock.mockResolvedValue({
      business: { id: "00000000-0000-4000-8000-000000000001", name: "Dinaya Salon", slug: "dinaya-salon" },
      directory: { category: "Salon", city: "Kandy", district: "Kandy", listed: true },
      filters: { limit: 80, q: "", status: "all" },
      referral: { bookings: 3, code: "dinaya-salon" },
      rows: [
        {
          channel: "tool",
          contentDate: null,
          id: "tool-booking-link",
          kind: "share_tool",
          locationName: null,
          status: "tool",
          statusLabel: "Tool",
          subtitle: "Copy and share the public booking page.",
          title: "Booking link",
          updatedAt: null,
        },
        {
          channel: "social",
          contentDate: "2026-06-01",
          id: "content_1",
          kind: "content",
          locationName: "Kandy",
          status: "draft",
          statusLabel: "draft",
          subtitle: "social · Kandy",
          title: "Monday content",
          updatedAt: "2026-05-29T03:00:00.000Z",
        },
      ],
      share: { bookingUrl: "https://dinaya.lk/book/dinaya-salon" },
      socialConnections: [],
      summary: {
        approvedContent: 0,
        draftContent: 1,
        failedContent: 0,
        publishedContent: 0,
        socialConnections: 0,
        tools: 4,
        totalContent: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/marketing");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getMarketingDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered marketing tools and content rows", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/marketing?status=draft&q=monday&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getMarketingDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 20,
      q: "monday",
      status: "draft",
    });
    expect(body.webUrl).toBe("/dashboard/marketing");
    expect(body.rows).toHaveLength(2);
    expect(body.summary.tools).toBe(4);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/marketing?status=archived");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getMarketingDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns 404 when desktop marketing context is missing", async () => {
    getMarketingDashboardListMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/marketing");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
  });
});
