import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const generateDealSuggestionsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/deals/suggestions", () => ({
  generateDealSuggestions: generateDealSuggestionsMock,
}));

import { GET } from "./route";

describe("GET /api/cron/deal-suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    generateDealSuggestionsMock.mockResolvedValue({ ok: true });
  });

  it("returns 401 without bearer token", async () => {
    const req = new NextRequest("http://localhost/api/cron/deal-suggestions");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(generateDealSuggestionsMock).not.toHaveBeenCalled();
  });

  it("runs when authorized", async () => {
    const req = new NextRequest("http://localhost/api/cron/deal-suggestions", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(generateDealSuggestionsMock).toHaveBeenCalled();
  });

  it("returns 500 when handler throws", async () => {
    generateDealSuggestionsMock.mockRejectedValue(new Error("cron failed"));
    const req = new NextRequest("http://localhost/api/cron/deal-suggestions", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
