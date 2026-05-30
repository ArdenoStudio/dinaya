import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getClientDashboardDetailMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/clients", () => ({
  getClientDashboardDetail: getClientDashboardDetailMock,
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/clients/:id", () => {
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

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1");
    const res = await GET(req, { params: Promise.resolve({ id: "client_1" }) });

    expect(res.status).toBe(401);
    expect(getClientDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the client is outside the tenant", async () => {
    getClientDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1");
    const res = await GET(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getClientDashboardDetailMock).toHaveBeenCalledWith("biz_1", "client_1");
  });

  it("returns client profile, booking history, and notes", async () => {
    getClientDashboardDetailMock.mockResolvedValue({
      client: {
        communicationOptOut: false,
        createdAt: "2026-05-01T00:00:00.000Z",
        email: "kasun@example.com",
        id: "client_1",
        internalNotes: "VIP",
        lastAiContactAt: null,
        loyaltyTier: "gold",
        name: "Kasun",
        phone: "+94770000000",
        source: "booking_page",
        stage: "active",
        tags: ["regular"],
      },
      bookings: [
        {
          id: "booking_1",
          serviceName: "Haircut",
          staffName: "Ashan",
          startsAt: "2026-05-28T09:00:00.000Z",
          status: "confirmed",
        },
      ],
      notes: [
        {
          body: "Prefers mornings",
          createdAt: "2026-05-20T10:00:00.000Z",
          id: "note_1",
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1");
    const res = await GET(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/clients/client_1");
    expect(body.client).toMatchObject({ id: "client_1", name: "Kasun", stage: "active" });
    expect(body.bookings).toHaveLength(1);
    expect(body.notes).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
