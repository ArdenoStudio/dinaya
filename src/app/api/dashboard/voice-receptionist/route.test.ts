import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const canUseFeatureMock = vi.hoisted(() => vi.fn(() => false));
const getBusinessPlanMock = vi.hoisted(() => vi.fn());
const planDisplayNameMock = vi.hoisted(() => vi.fn(() => "Growth"));
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    insert: dbInsertMock,
    select: dbSelectMock,
  },
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/plan", () => {
  class PlanRequiredError extends Error {
    requiredPlan = "max" as const;
  }

  return {
    PlanRequiredError,
    canUseFeature: canUseFeatureMock,
    getBusinessPlan: getBusinessPlanMock,
    planDisplayName: planDisplayNameMock,
    requirePro: requireProMock,
  };
});

import { POST } from "./route";

describe("POST /api/dashboard/voice-receptionist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });
  });

  it("blocks tenant setup requests while the rollout is paused", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/voice-receptionist", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.rollout).toBe("coming_soon");
    expect(body.error).toContain("coming soon");
    expect(requireProMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
  });
});
