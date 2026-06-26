import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const generateAiContentDashboardCalendarMock = vi.hoisted(() => vi.fn());
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
    aiContentRequestSchema: z.object({ locationId: z.uuid().optional() }),
    generateAiContentDashboardCalendar: generateAiContentDashboardCalendarMock,
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

describe("POST /api/v1/desktop/ai/content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    generateAiContentDashboardCalendarMock.mockResolvedValue([
      { caption: "Book today", contentDate: "2026-06-01", id: "content_1", status: "draft", title: "Day 1" },
    ]);
  });

  it("generates a content calendar for a branch", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/ai/content", {
      body: JSON.stringify({ locationId: "11111111-1111-4111-8111-111111111111" }),
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "aiContentMachine");
    expect(generateAiContentDashboardCalendarMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "11111111-1111-4111-8111-111111111111",
    );
    expect(body.items).toHaveLength(1);
  });

  it("returns 404 when no active branch exists", async () => {
    generateAiContentDashboardCalendarMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/ai/content", {
      body: JSON.stringify({}),
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("No active branch found.");
  });
});
