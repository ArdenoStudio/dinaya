import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const updateAiLocationDashboardConfigMock = vi.hoisted(() => vi.fn());
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
    aiLocationConfigPatchSchema: z.object({
      clientReactivationCampaign: z.boolean().optional(),
      aiDealSuggestions: z.boolean().optional(),
    }),
    updateAiLocationDashboardConfig: updateAiLocationDashboardConfigMock,
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

describe("PATCH /api/v1/desktop/ai/locations/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    updateAiLocationDashboardConfigMock.mockResolvedValue({
      aiConfig: { clientReactivationCampaign: true, aiDealSuggestions: false },
      locationId: "loc_1",
    });
  });

  it("updates branch AI feature toggles", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/locations/loc_1", {
      body: JSON.stringify({ clientReactivationCampaign: true }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "loc_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "aiBookingAutopilot");
    expect(updateAiLocationDashboardConfigMock).toHaveBeenCalledWith("biz_1", "loc_1", {
      clientReactivationCampaign: true,
    });
    expect(body.locationId).toBe("loc_1");
    expect(body.aiConfig.clientReactivationCampaign).toBe(true);
  });

  it("rejects invalid AI settings", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/locations/loc_1", {
      body: JSON.stringify({ clientReactivationCampaign: "yes" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "loc_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid AI settings.");
    expect(updateAiLocationDashboardConfigMock).not.toHaveBeenCalled();
  });
});
