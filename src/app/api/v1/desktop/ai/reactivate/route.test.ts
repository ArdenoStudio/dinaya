import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const runAiReactivationDashboardMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/ai", async () => {
  const { z } = await import("@/lib/validation");
  return {
    aiReactivationRequestSchema: z.object({ clientId: z.uuid().optional() }),
    runAiReactivationDashboard: runAiReactivationDashboardMock,
  };
});

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { POST } from "./route";

describe("POST /api/v1/desktop/ai/reactivate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    runAiReactivationDashboardMock.mockResolvedValue({
      previews: [{ clientName: "Kasun", status: "sent" }],
      stats: { checked: 1, duplicate: 0, failed: 0, sent: 1, skipped: 0 },
    });
  });

  it("runs manual client reactivation", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/reactivate", {
      body: JSON.stringify({}),
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "clientReactivationCampaign");
    expect(runAiReactivationDashboardMock).toHaveBeenCalledWith("biz_1", { clientId: undefined });
    expect(body.stats.sent).toBe(1);
    expect(body.previews).toHaveLength(1);
  });

  it("rejects invalid client ids", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/reactivate", {
      body: JSON.stringify({ clientId: "not-a-uuid" }),
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid reactivation request.");
    expect(runAiReactivationDashboardMock).not.toHaveBeenCalled();
  });
});
