import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const getAiWorkflowRunsDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/dashboard/ai", () => ({
  getAiWorkflowRunsDashboardList: getAiWorkflowRunsDashboardListMock,
}));

import { GET } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET /api/dashboard/ai/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    getAiWorkflowRunsDashboardListMock.mockResolvedValue({
      rows: [{ id: "run_1", status: "completed" }],
    });
  });

  it("returns 401 when auth fails", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/ai/runs");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns dashboard AI workflow runs", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/ai/runs");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getAiWorkflowRunsDashboardListMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { limit: 100 },
    );
    expect(body).toEqual({ runs: [{ id: "run_1", status: "completed" }] });
  });
});
