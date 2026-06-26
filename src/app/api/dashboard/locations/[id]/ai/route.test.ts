import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const getLocationForBusinessMock = vi.hoisted(() => vi.fn());
const updateAiLocationDashboardConfigMock = vi.hoisted(() => vi.fn());
const aiLocationConfigPatchSchemaMock = vi.hoisted(() => ({
  safeParse: vi.fn(),
}));

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/dashboard/ai", () => ({
  aiLocationConfigPatchSchema: aiLocationConfigPatchSchemaMock,
  updateAiLocationDashboardConfig: updateAiLocationDashboardConfigMock,
}));

vi.mock("@/lib/locations", () => ({
  getLocationForBusiness: getLocationForBusinessMock,
}));

import { GET, PATCH } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET, PATCH /api/dashboard/locations/[id]/ai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    getLocationForBusinessMock.mockResolvedValue({ aiConfig: { smartReminderSystem: true } });
    aiLocationConfigPatchSchemaMock.safeParse.mockReturnValue({
      success: true,
      data: { smartReminderSystem: false },
    });
    updateAiLocationDashboardConfigMock.mockResolvedValue({
      aiConfig: { smartReminderSystem: false },
    });
  });

  it("returns 401 when auth fails on GET", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/locations/[id]/ai");
    const res = await GET(req, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000003" }) });

    expect(res.status).toBe(401);
  });

  it("returns AI config for the location", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/locations/[id]/ai");
    const res = await GET(req, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000003" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ aiConfig: { smartReminderSystem: true } });
  });

  it("returns 400 for invalid AI patch payloads", async () => {
    aiLocationConfigPatchSchemaMock.safeParse.mockReturnValueOnce({ success: false });

    const req = new NextRequest("http://localhost/api/dashboard/locations/[id]/ai", {
      method: "PATCH",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000003" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid AI settings.");
  });

  it("updates the AI config for the location", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/locations/[id]/ai", {
      method: "PATCH",
      body: JSON.stringify({ smartReminderSystem: false }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000003" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateAiLocationDashboardConfigMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000003",
      { smartReminderSystem: false },
    );
    expect(body).toEqual({ aiConfig: { smartReminderSystem: false } });
  });
});
