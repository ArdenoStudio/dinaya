import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const updateAiContentDashboardActionMock = vi.hoisted(() => vi.fn());
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
    aiContentActionSchema: z.object({ action: z.enum(["approve", "publish"]) }),
    updateAiContentDashboardAction: updateAiContentDashboardActionMock,
  };
});

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { PATCH } from "./route";

describe("PATCH /api/v1/desktop/ai/content/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    updateAiContentDashboardActionMock.mockResolvedValue({
      id: "content_1",
      status: "approved",
      title: "Day 1",
    });
  });

  it("updates AI content status", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/content/content_1", {
      body: JSON.stringify({ action: "approve" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "content_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "aiContentMachine");
    expect(updateAiContentDashboardActionMock).toHaveBeenCalledWith("biz_1", "content_1", "approve");
    expect(body.item.status).toBe("approved");
  });

  it("rejects invalid content actions", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/content/content_1", {
      body: JSON.stringify({ action: "delete" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "content_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid content update.");
    expect(updateAiContentDashboardActionMock).not.toHaveBeenCalled();
  });
});
