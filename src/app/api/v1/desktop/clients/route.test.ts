import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getClientsDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/clients", () => ({
  getClientsDashboardList: getClientsDashboardListMock,
  isDashboardClientStageFilter: (value: string) => ["all", "lead", "prospect", "active", "churned"].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    getClientsDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", stage: "all" },
      rows: [
        {
          bookingCount: 3,
          communicationOptOut: false,
          completedBookings: 2,
          createdAt: "2026-05-28T09:00:00.000Z",
          email: "nilu@example.com",
          id: "client_1",
          lastAiContactAt: null,
          lastBookingAt: "2026-05-28T09:30:00.000Z",
          loyaltyTier: "gold",
          name: "Nilu Perera",
          phone: "0770000000",
          source: "booking_page",
          stage: "active",
          tags: ["vip"],
        },
      ],
      summary: {
        activeClients: 1,
        churnedClients: 0,
        leads: 0,
        optedOutClients: 0,
        prospects: 0,
        totalClients: 1,
        withEmail: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getClientsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered clients with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/clients?stage=active&q=nilu&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getClientsDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 20,
      q: "nilu",
      stage: "active",
    });
    expect(body.webUrl).toBe("/dashboard/clients");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.activeClients).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid stage filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/clients?stage=lost");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("stage is invalid.");
    expect(getClientsDashboardListMock).not.toHaveBeenCalled();
  });
});
