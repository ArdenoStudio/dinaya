import { NextRequest, NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  scope: string;
  limit: number;
  windowSeconds: number;
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimitKey(scope: string, req: NextRequest, suffix?: string): string {
  const ip = getClientIp(req);
  return suffix ? `${scope}:${ip}:${suffix}` : `${scope}:${ip}`;
}

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

function checkMemoryLimit(key: string, config: RateLimitConfig): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();

  if (buckets.size >= 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { ok: true };
  }

  if (existing.count >= config.limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true };
}

async function checkUpstashLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ ok: true } | { ok: false; retryAfter: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      prefix: `dinaya:${config.scope}`,
    });
    const result = await ratelimit.limit(key);
    if (result.success) return { ok: true };
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error("[rate-limit] Upstash unavailable, falling back to memory", error);
    return null;
  }
}

export async function withRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  options?: { keySuffix?: string },
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (process.env.E2E_DISABLE_RATE_LIMIT === "true") {
    return { ok: true };
  }

  const key = rateLimitKey(config.scope, req, options?.keySuffix);

  const upstash = await checkUpstashLimit(key, config);
  const result = upstash ?? checkMemoryLimit(key, config);

  if (result.ok) return { ok: true };
  return { ok: false, response: tooManyRequests(result.retryAfter) };
}

export const DASHBOARD_MUTATION_LIMIT: RateLimitConfig = {
  scope: "dashboard-mutation",
  limit: 120,
  windowSeconds: 60,
};

export async function withDashboardRateLimit(
  req: NextRequest,
  businessId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  return withRateLimit(req, DASHBOARD_MUTATION_LIMIT, { keySuffix: businessId });
}

/** @deprecated Use withRateLimit */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
): { ok: true } | { ok: false; response: NextResponse } {
  return checkMemoryLimit(rateLimitKey(config.scope, req), config).ok
    ? { ok: true }
    : {
        ok: false,
        response: tooManyRequests(
          Math.max(
            1,
            Math.ceil(
              ((buckets.get(rateLimitKey(config.scope, req))?.resetAt ?? Date.now()) - Date.now()) / 1000,
            ),
          ),
        ),
      };
}
