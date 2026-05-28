import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getIntegrationDashboardDetailMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/integrations", () => ({
  getIntegrationDashboardDetail: getIntegrationDashboardDetailMock,
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/integrations/:id", () => {
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

    const req = new NextRequest("http://localhost/api/v1/desktop/integrations/integration_1");
    const res = await GET(req, { params: Promise.resolve({ id: "integration_1" }) });

    expect(res.status).toBe(401);
    expect(getIntegrationDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an integration outside the tenant", async () => {
    getIntegrationDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/integrations/integration_1");
    const res = await GET(req, { params: Promise.resolve({ id: "integration_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getIntegrationDashboardDetailMock).toHaveBeenCalledWith("biz_1", "integration_1");
  });

  it("returns social connection detail", async () => {
    getIntegrationDashboardDetailMock.mockResolvedValue({
      integration: {
        accountId: "calendar_1",
        accountName: "Kandy calendar",
        createdAt: "2026-05-28T09:00:00.000Z",
        id: "integration_1",
        isActive: true,
        kind: "social",
        meta: { sync: true },
        provider: "google_calendar",
        setupPath: "/dashboard/settings/integrations",
        status: "active",
        statusLabel: "Active",
        updatedAt: "2026-05-28T09:05:00.000Z",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/integrations/integration_1");
    const res = await GET(req, { params: Promise.resolve({ id: "integration_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/settings/integrations");
    expect(body.integration).toMatchObject({ kind: "social", provider: "google_calendar", status: "active" });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("returns voice receptionist integration detail", async () => {
    getIntegrationDashboardDetailMock.mockResolvedValue({
      integration: {
        activatedAt: null,
        aiPhoneNumber: null,
        bookingRules: "Confirm name and service.",
        businessPhone: "0770000000",
        createdAt: "2026-05-28T09:00:00.000Z",
        fallbackMessage: null,
        faqNotes: "Parking available.",
        handoffPhone: "0771111111",
        id: "voice_1",
        kind: "voice",
        languages: ["en", "si"],
        lastTestedAt: null,
        openingRules: "9-5",
        provider: "Peak Agents",
        requestedAt: "2026-05-28T09:00:00.000Z",
        serviceRules: null,
        setupNotes: null,
        setupPath: "/dashboard/settings/voice-receptionist",
        status: "requested",
        statusLabel: "Requested",
        updatedAt: "2026-05-28T09:05:00.000Z",
        welcomeMessage: "Hello",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/integrations/voice_1");
    const res = await GET(req, { params: Promise.resolve({ id: "voice_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/settings/voice-receptionist");
    expect(body.integration).toMatchObject({ kind: "voice", provider: "Peak Agents", statusLabel: "Requested" });
  });
});
