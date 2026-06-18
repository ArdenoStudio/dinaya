import { afterEach, describe, expect, it } from "vitest";
import {
  assertDistributedRateLimitInProduction,
  hasDistributedRateLimit,
  isProductionRuntime,
} from "@/lib/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("env helpers", () => {
  it("detects production runtime excluding Vercel preview", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    expect(isProductionRuntime()).toBe(true);

    process.env.VERCEL_ENV = "preview";
    expect(isProductionRuntime()).toBe(false);
  });

  it("requires Upstash in production when distributed rate limiting is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(hasDistributedRateLimit()).toBe(false);
    expect(() => assertDistributedRateLimitInProduction()).toThrow(/UPSTASH_REDIS/);
  });

  it("allows production when Upstash is configured", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    expect(hasDistributedRateLimit()).toBe(true);
    expect(() => assertDistributedRateLimitInProduction()).not.toThrow();
  });
});
