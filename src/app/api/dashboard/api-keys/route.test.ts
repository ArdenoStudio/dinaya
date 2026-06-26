import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dbInsertMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const requireApiBusinessMock = vi.hoisted(() => vi.fn());
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

vi.mock("@/lib/api-handler", () => ({
  withApiHandler: async (handler: () => Promise<Response>) => handler(),
}));

vi.mock("@/lib/plan", () => {
  class PlanRequiredError extends Error {
    requiredPlan = "pro" as const;
  }

  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { POST } from "./route";

describe("POST /api/dashboard/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });
  });

  it("blocks voice-scoped keys while AI Voice Receptionist is coming soon", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/api-keys", {
      method: "POST",
      body: JSON.stringify({
        name: "AI Voice Receptionist",
        scopes: ["voice:read", "voice:write"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain("coming soon");
    expect(requireProMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
  });
});
