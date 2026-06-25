import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const retryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/webhook-retries", () => ({
  retryDueWebhookDeliveries: retryMock,
}));

import { GET } from "./route";

describe("GET /api/cron/webhook-retries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
  });

  it("returns 401 without bearer token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cron/webhook-retries"));

    expect(res.status).toBe(401);
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("retries due webhook deliveries when authorized", async () => {
    retryMock.mockResolvedValue(3);

    const res = await GET(
      new NextRequest("http://localhost/api/cron/webhook-retries", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ retried: 3 });
    expect(retryMock).toHaveBeenCalledOnce();
  });

  it("returns 500 when the cron handler throws", async () => {
    retryMock.mockRejectedValue(new Error("retry failed"));

    const res = await GET(
      new NextRequest("http://localhost/api/cron/webhook-retries", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "retry failed" });
  });
});
