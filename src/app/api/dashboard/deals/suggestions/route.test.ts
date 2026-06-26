import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const listPendingDealSuggestionsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/deals/suggestions", () => ({
  listPendingDealSuggestions: listPendingDealSuggestionsMock,
}));

import { GET } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET /api/dashboard/deals/suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    listPendingDealSuggestionsMock.mockResolvedValue([
      {
        id: "suggestion_1",
        reason: "Weekday afternoons are quiet.",
        apptWindowStart: new Date("2026-06-10T09:00:00.000Z"),
        apptWindowEnd: new Date("2026-06-10T17:00:00.000Z"),
        meta: null,
      },
    ]);
  });

  it("returns 401 when auth fails", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/deals/suggestions");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns serialized deal suggestions", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/deals/suggestions");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listPendingDealSuggestionsMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
    expect(body).toEqual([
      expect.objectContaining({
        id: "suggestion_1",
        headline: "Weekday afternoons are quiet.",
        apptWindowStart: "2026-06-10T09:00:00.000Z",
        apptWindowEnd: "2026-06-10T17:00:00.000Z",
        learningLine: null,
        demandLine: null,
      }),
    ]);
  });
});
