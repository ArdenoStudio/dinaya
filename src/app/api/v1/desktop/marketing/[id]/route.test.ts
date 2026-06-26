import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getMarketingDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateMarketingContentActionMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/marketing", () => ({
  getMarketingDashboardDetail: getMarketingDashboardDetailMock,
  updateMarketingContentAction: updateMarketingContentActionMock,
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET, PATCH } from "./route";

describe("GET /api/v1/desktop/marketing/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireDesktopWriteMock.mockResolvedValue({
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

    const req = new NextRequest("http://localhost/api/v1/desktop/marketing/tool-booking-link");
    const res = await GET(req, { params: Promise.resolve({ id: "tool-booking-link" }) });

    expect(res.status).toBe(401);
    expect(getMarketingDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns share tool detail for native marketing tools", async () => {
    getMarketingDashboardDetailMock.mockResolvedValue({
      business: { id: "00000000-0000-4000-8000-000000000001", name: "Dinaya Salon", slug: "dinaya-salon" },
      directory: { category: "Salon", city: "Kandy", district: "Kandy", listed: true },
      kind: "share_tool",
      referral: { bookings: 3, code: "dinaya-salon" },
      share: {
        bookingUrl: "https://dinaya.lk/book/dinaya-salon",
        embedSnippet: "<iframe />",
        instagramSnippet: "Instagram copy",
        qrPng: "https://qr.example/png",
        qrSvg: "https://qr.example/svg",
        reviewsEmbedSnippet: "<iframe />",
        reviewsEmbedUrl: "https://dinaya.lk/embed/reviews/dinaya-salon",
        whatsappSnippet: "WhatsApp copy",
      },
      socialConnections: [{ accountName: "Dinaya", id: "social_1", isActive: true, provider: "google" }],
      tool: { description: "Copy and share.", id: "tool-booking-link", title: "Booking link" },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/marketing/tool-booking-link");
    const res = await GET(req, { params: Promise.resolve({ id: "tool-booking-link" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/marketing");
    expect(body.kind).toBe("share_tool");
    expect(body.share.bookingUrl).toContain("dinaya-salon");
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("returns 404 for marketing content outside the tenant", async () => {
    getMarketingDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/marketing/content_1");
    const res = await GET(req, { params: Promise.resolve({ id: "content_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getMarketingDashboardDetailMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "content_1");
  });

  it("approves content calendar items with desktop write scope", async () => {
    updateMarketingContentActionMock.mockResolvedValue({ id: "content_1", status: "approved" });
    getMarketingDashboardDetailMock.mockResolvedValue({
      business: { id: "00000000-0000-4000-8000-000000000001", name: "Dinaya Salon", slug: "dinaya-salon" },
      content: {
        approvedAt: "2026-05-29T03:00:00.000Z",
        caption: "Book today",
        channel: "social",
        contentDate: "2026-05-30",
        createdAt: "2026-05-29T02:00:00.000Z",
        error: null,
        id: "content_1",
        meta: { source: "fallback" },
        provider: null,
        providerMessageId: null,
        publishedAt: null,
        status: "approved",
        title: "Day 1",
        updatedAt: "2026-05-29T03:00:00.000Z",
      },
      directory: { category: null, city: null, district: null, listed: false },
      kind: "content",
      location: { id: "location_1", name: "Kandy", timezone: "Asia/Colombo" },
      referral: { bookings: 0, code: "dinaya-salon" },
      share: { bookingUrl: "https://dinaya.lk/book/dinaya-salon" },
      socialConnections: [],
      workflow: { canApprove: false, canPublish: true },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/marketing/content_1", {
      body: JSON.stringify({ action: "approve" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "content_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "aiContentMachine");
    expect(updateMarketingContentActionMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "content_1", "approve");
    expect(body.content).toMatchObject({ id: "content_1", status: "approved" });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects malformed marketing updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/marketing/content_1", {
      body: JSON.stringify({ action: "archive" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "content_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid marketing update.");
    expect(updateMarketingContentActionMock).not.toHaveBeenCalled();
  });
});
