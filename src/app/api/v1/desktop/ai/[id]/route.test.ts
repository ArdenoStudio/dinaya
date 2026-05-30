import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getAiWorkflowRunDashboardDetailMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/ai", () => ({
  getAiWorkflowRunDashboardDetail: getAiWorkflowRunDashboardDetailMock,
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/ai/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/ai/run_1");
    const res = await GET(req, { params: Promise.resolve({ id: "run_1" }) });

    expect(res.status).toBe(401);
    expect(getAiWorkflowRunDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a workflow run outside the tenant", async () => {
    getAiWorkflowRunDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/ai/run_1");
    const res = await GET(req, { params: Promise.resolve({ id: "run_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "aiBookingAutopilot");
    expect(getAiWorkflowRunDashboardDetailMock).toHaveBeenCalledWith("biz_1", "run_1");
  });

  it("returns workflow run copy, delivery context, and branch context", async () => {
    getAiWorkflowRunDashboardDetailMock.mockResolvedValue({
      location: { id: "location_1", name: "Kandy" },
      run: {
        body: "Hi Kasun, your reminder...",
        channel: "whatsapp",
        createdAt: "2026-05-28T09:00:00.000Z",
        entityId: "booking_1",
        entityType: "booking",
        error: null,
        executedAt: "2026-05-28T09:01:00.000Z",
        feature: "smartReminderSystem",
        id: "run_1",
        idempotencyKey: "smart-reminder:booking_1",
        meta: { copySource: "ai" },
        provider: "twilio",
        scheduledFor: null,
        status: "sent",
        subject: "Booking reminder",
        workflowKey: "smart-reminder-24h",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/ai/run_1");
    const res = await GET(req, { params: Promise.resolve({ id: "run_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/ai");
    expect(body.location).toMatchObject({ name: "Kandy" });
    expect(body.run).toMatchObject({ id: "run_1", status: "sent", provider: "twilio" });
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
