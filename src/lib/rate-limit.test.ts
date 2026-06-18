import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("withRateLimit production fail-closed", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.E2E_DISABLE_RATE_LIMIT;
  });

  it("returns 503 when Upstash is unavailable in production", async () => {
    vi.doMock("@upstash/ratelimit", () => {
      throw new Error("upstash unavailable");
    });
    vi.doMock("@upstash/redis", () => {
      throw new Error("upstash unavailable");
    });

    const { withRateLimit } = await import("@/lib/rate-limit");
    const req = new NextRequest("http://localhost/api/bookings", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });

    const result = await withRateLimit(req, {
      scope: "booking-create",
      limit: 10,
      windowSeconds: 60,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
      const body = await result.response.json();
      expect(body.error).toContain("temporarily unavailable");
    }
  });
});
