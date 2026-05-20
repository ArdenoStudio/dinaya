import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIMEOUT_MS = 6000;

export async function GET() {
  const startedAt = Date.now();
  const sandbox = process.env.PAYHERE_SANDBOX === "true";
  const url = sandbox ? "https://sandbox.payhere.lk/" : "https://www.payhere.lk/";

  let ok = false;
  let upstreamStatus: number | null = null;
  let latencyMs: number | null = null;
  let error: string | null = null;

  try {
    const t0 = Date.now();
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Dinaya-HealthCheck/1.0" },
    });
    latencyMs = Date.now() - t0;
    upstreamStatus = res.status;
    ok = res.status < 500 && res.status !== 0;
  } catch (err) {
    error = err instanceof Error ? err.name : "unknown_error";
  }

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "payments",
      provider: "payhere",
      mode: sandbox ? "sandbox" : "production",
      upstreamStatus,
      latencyMs,
      error,
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
