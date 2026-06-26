import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const runAiWorkflowsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/workflows", () => ({
  runAiWorkflows: runAiWorkflowsMock,
}));

import { GET } from "./route";

describe("GET /api/cron/ai-workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    runAiWorkflowsMock.mockResolvedValue({ ok: true });
  });

  it("returns 401 without bearer token", async () => {
    const req = new NextRequest("http://localhost/api/cron/ai-workflows");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(runAiWorkflowsMock).not.toHaveBeenCalled();
  });

  it("runs when authorized", async () => {
    const req = new NextRequest("http://localhost/api/cron/ai-workflows", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(runAiWorkflowsMock).toHaveBeenCalled();
  });

  it("returns 500 when handler throws", async () => {
    runAiWorkflowsMock.mockRejectedValue(new Error("cron failed"));
    const req = new NextRequest("http://localhost/api/cron/ai-workflows", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
