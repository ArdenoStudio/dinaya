import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();

  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const dbStart = Date.now();
    await Promise.race([
      sql`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db_timeout")), DB_TIMEOUT_MS),
      ),
    ]);
    dbLatencyMs = Date.now() - dbStart;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "unknown_error";
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      db: {
        ok: dbOk,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
    },
    responseTimeMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
