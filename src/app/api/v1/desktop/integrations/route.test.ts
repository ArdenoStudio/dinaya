import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getIntegrationsDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/integrations", () => ({
  getIntegrationsDashboardList: getIntegrationsDashboardListMock,
  isDashboardIntegrationStatusFilter: (value: string) => [
    "all",
    "connected",
    "available",
    "action_required",
    "env_required",
    "gated",
  ].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    getIntegrationsDashboardListMock.mockResolvedValue({
      domain: {
        customDomain: null,
        customDomainConfig: null,
        customDomainError: null,
        customDomainStatus: "none",
        customDomainVerification: null,
        customDomainVerificationToken: null,
        customDomainVerified: false,
      },
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          accountName: "Kandy calendar",
          actionLabel: "Manage",
          category: "calendar",
          description: "Push confirmed bookings to a connected Google Calendar.",
          detailId: "social_1",
          id: "google-calendar",
          kind: "social",
          name: "Google Calendar",
          provider: "google_calendar",
          setupPath: "/dashboard/settings/integrations",
          status: "connected",
          statusLabel: "Connected",
          updatedAt: "2026-05-28T09:00:00.000Z",
        },
      ],
      summary: {
        actionRequiredIntegrations: 0,
        availableIntegrations: 0,
        connectedIntegrations: 1,
        envRequiredIntegrations: 0,
        gatedIntegrations: 0,
        totalIntegrations: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/integrations");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getIntegrationsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered integrations with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/integrations?status=connected&q=calendar&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getIntegrationsDashboardListMock).toHaveBeenCalledWith("biz_1", {
      limit: 20,
      q: "calendar",
      status: "connected",
    });
    expect(body.webUrl).toBe("/dashboard/settings/integrations");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.connectedIntegrations).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/integrations?status=installed");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getIntegrationsDashboardListMock).not.toHaveBeenCalled();
  });
});
