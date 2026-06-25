import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const releaseMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/deals/holds", () => ({
  releaseStaleDealHolds: releaseMock,
}));

import { GET } from "./route";

describe("GET /api/cron/deal-holds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
  });

  it("returns 401 without bearer token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cron/deal-holds"));

    expect(res.status).toBe(401);
    expect(releaseMock).not.toHaveBeenCalled();
  });

  it("releases stale deal holds when authorized", async () => {
    releaseMock.mockResolvedValue({ released: 4 });

    const res = await GET(
      new NextRequest("http://localhost/api/cron/deal-holds", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ released: 4 });
    expect(releaseMock).toHaveBeenCalledOnce();
  });

  it("returns 500 when the cron handler throws", async () => {
    releaseMock.mockRejectedValue(new Error("deal holds failed"));

    const res = await GET(
      new NextRequest("http://localhost/api/cron/deal-holds", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "deal holds failed" });
  });
});
