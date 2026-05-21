import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireHealthAuth } from "@/lib/health-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_TIMEOUT_MS = 8000;

export async function GET(req: NextRequest) {
  const authError = requireHealthAuth(req);
  if (authError) return authError;
  const startedAt = Date.now();

  let ok = false;
  let latencyMs: number | null = null;
  let error: string | null = null;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const t0 = Date.now();
    await Promise.race([
      sql`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db_timeout")), DB_TIMEOUT_MS),
      ),
    ]);
    latencyMs = Date.now() - t0;
    ok = true;
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown_error";
  }

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "database",
      provider: "neon",
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
