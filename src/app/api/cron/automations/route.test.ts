import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const processMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/automations/engine", () => ({
  processDueAutomationRuns: processMock,
}));

import { GET } from "./route";

describe("GET /api/cron/automations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
  });

  it("returns 401 without bearer token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cron/automations"));

    expect(res.status).toBe(401);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("processes due automations when authorized", async () => {
    processMock.mockResolvedValue({ processed: 2, failed: 1 });

    const res = await GET(
      new NextRequest("http://localhost/api/cron/automations", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ processed: 2, failed: 1 });
    expect(processMock).toHaveBeenCalledOnce();
  });

  it("returns 500 when the cron handler throws", async () => {
    processMock.mockRejectedValue(new Error("automation failed"));

    const res = await GET(
      new NextRequest("http://localhost/api/cron/automations", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "automation failed" });
  });
});
