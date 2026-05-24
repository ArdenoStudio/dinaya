import { NextRequest, NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/platform-health";
import { requireHealthAuth } from "@/lib/health-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const authError = requireHealthAuth(req);
  if (authError) return authError;
  const startedAt = Date.now();

  const check = await checkDatabaseHealth();
  const ok = check.status === "up";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "database",
      provider: check.provider ?? "neon",
      latencyMs: check.latencyMs,
      error: check.error ?? null,
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
