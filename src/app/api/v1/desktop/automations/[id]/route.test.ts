import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getAutomationDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateAutomationDashboardFieldsMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/automations", () => ({
  getAutomationDashboardDetail: getAutomationDashboardDetailMock,
  updateAutomationDashboardFields: updateAutomationDashboardFieldsMock,
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET, PATCH } from "./route";

describe("/api/v1/desktop/automations/:id", () => {
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

    const req = new NextRequest("http://localhost/api/v1/desktop/automations/rule_1");
    const res = await GET(req, { params: Promise.resolve({ id: "rule_1" }) });

    expect(res.status).toBe(401);
    expect(getAutomationDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns rule detail with run summary", async () => {
    getAutomationDashboardDetailMock.mockResolvedValue({
      recentRuns: [
        {
          createdAt: "2026-05-28T09:05:00.000Z",
          entityId: "booking_1",
          error: null,
          id: "run_1",
          status: "sent",
          triggerVersion: "v1",
        },
      ],
      rule: {
        actions: [{ type: "send_email", template: "review_request" }],
        conditions: null,
        createdAt: "2026-05-28T09:00:00.000Z",
        delayMinutes: 120,
        id: "rule_1",
        isActive: true,
        name: "Review request",
        trigger: "booking.completed",
        updatedAt: "2026-05-28T09:00:00.000Z",
      },
      summary: { failed: 0, pending: 0, sent: 1, skipped: 0, total: 1 },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/automations/rule_1");
    const res = await GET(req, { params: Promise.resolve({ id: "rule_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/automations");
    expect(body.rule).toMatchObject({ id: "rule_1", isActive: true });
    expect(body.summary.sent).toBe(1);
    expect(body.recentRuns).toHaveLength(1);
  });

  it("toggles the rule and returns refreshed detail", async () => {
    updateAutomationDashboardFieldsMock.mockResolvedValue({ id: "rule_1" });
    getAutomationDashboardDetailMock.mockResolvedValue({
      recentRuns: [],
      rule: {
        actions: [],
        conditions: null,
        createdAt: "2026-05-28T09:00:00.000Z",
        delayMinutes: 0,
        id: "rule_1",
        isActive: false,
        name: "Confirmation",
        trigger: "booking.confirmed",
        updatedAt: "2026-05-28T09:05:00.000Z",
      },
      summary: { failed: 0, pending: 0, sent: 0, skipped: 0, total: 0 },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/automations/rule_1", {
      body: JSON.stringify({ isActive: false }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "rule_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "automations");
    expect(updateAutomationDashboardFieldsMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "rule_1", { isActive: false });
    expect(body.rule).toMatchObject({ id: "rule_1", isActive: false });
  });

  it("rejects invalid patch bodies", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/automations/rule_1", {
      body: JSON.stringify({ isActive: "yes" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "rule_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid automation update.");
    expect(updateAutomationDashboardFieldsMock).not.toHaveBeenCalled();
  });
});
