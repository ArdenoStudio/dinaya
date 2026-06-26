import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getAutomationsDashboardListMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/automations", () => ({
  getAutomationsDashboardList: getAutomationsDashboardListMock,
  isDashboardAutomationStatusFilter: (value: string) => ["all", "active", "paused"].includes(value),
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/automations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    getAutomationsDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          actions: [{ type: "send_email", template: "review_request" }],
          conditions: null,
          createdAt: "2026-05-28T09:00:00.000Z",
          delayMinutes: 120,
          id: "rule_1",
          isActive: true,
          name: "Review request",
          runSummary: { failed: 0, pending: 0, sent: 1, skipped: 0, total: 1 },
          trigger: "booking.completed",
          updatedAt: "2026-05-28T09:05:00.000Z",
        },
      ],
      summary: {
        activeRules: 1,
        delayedRules: 1,
        failedRuns: 0,
        instantRules: 0,
        pausedRules: 0,
        pendingRuns: 0,
        sentRuns: 1,
        skippedRuns: 0,
        totalRules: 1,
        totalRuns: 1,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/automations");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getAutomationsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered automation rules with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/automations?status=active&q=review&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "automations");
    expect(getAutomationsDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 20,
      q: "review",
      status: "active",
    });
    expect(body.webUrl).toBe("/dashboard/automations");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.sentRuns).toBe(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/automations?status=draft");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getAutomationsDashboardListMock).not.toHaveBeenCalled();
  });
});
