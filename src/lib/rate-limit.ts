import { NextRequest, NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  /** Unique scope, e.g. "register" or "bookings" */
  scope: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function pruneExpired(now: number): void {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
): { ok: true } | { ok: false; response: NextResponse } {
  const now = Date.now();
  pruneExpired(now);

  const key = `${config.scope}:${getClientIp(req)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { ok: true };
  }

  if (existing.count >= config.limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "Cache-Control": "no-store",
          },
        },
      ),
    };
  }

  existing.count += 1;
  return { ok: true };
}

export async function withRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  return checkRateLimit(req, config);
}
