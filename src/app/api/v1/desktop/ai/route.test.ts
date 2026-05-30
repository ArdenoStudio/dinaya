import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getAiHubDashboardDataMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/ai", () => ({
  getAiHubDashboardData: getAiHubDashboardDataMock,
  isDashboardAiWorkflowRunStatusFilter: (value: string) => ["all", "queued", "sent", "failed", "skipped", "duplicate", "completed"].includes(value),
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/ai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    getAiHubDashboardDataMock.mockResolvedValue({
      content: [
        {
          caption: "Book this week",
          contentDate: "2026-06-01",
          error: null,
          id: "content_1",
          locationId: "loc_1",
          status: "draft",
          title: "Monday content",
        },
      ],
      features: [
        {
          description: "Win back clients who have not booked in a while.",
          key: "clientReactivationCampaign",
          label: "Client Reactivation",
        },
      ],
      filters: { limit: 80, q: "", status: "all" },
      locations: [
        {
          address: "Kandy",
          aiConfig: { clientReactivationCampaign: true },
          id: "loc_1",
          isDefault: true,
          name: "Kandy",
        },
      ],
      rows: [
        {
          body: "Hi Kasun, your reminder...",
          channel: "whatsapp",
          createdAt: "2026-05-28T09:00:00.000Z",
          entityId: "booking_1",
          entityType: "booking",
          error: null,
          executedAt: "2026-05-28T09:01:00.000Z",
          feature: "smartReminderSystem",
          id: "run_1",
          locationId: "location_1",
          locationName: "Kandy",
          provider: "twilio",
          scheduledFor: null,
          status: "sent",
          subject: "Booking reminder",
          workflowKey: "smart-reminder-24h",
        },
      ],
      summary: {
        completedRuns: 0,
        duplicateRuns: 0,
        failedRuns: 0,
        queuedRuns: 0,
        sentRuns: 1,
        skippedRuns: 0,
        totalRuns: 1,
        workflows: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/ai");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getAiHubDashboardDataMock).not.toHaveBeenCalled();
  });

  it("returns filtered AI workflow runs with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai?status=sent&q=reminder&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "aiBookingAutopilot");
    expect(getAiHubDashboardDataMock).toHaveBeenCalledWith("biz_1", {
      limit: 20,
      q: "reminder",
      status: "sent",
    });
    expect(body.webUrl).toBe("/dashboard/ai");
    expect(body.rows).toHaveLength(1);
    expect(body.locations).toHaveLength(1);
    expect(body.content).toHaveLength(1);
    expect(body.summary.sentRuns).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai?status=published");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getAiHubDashboardDataMock).not.toHaveBeenCalled();
  });
});
