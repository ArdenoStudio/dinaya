import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireHealthAuth } from "@/lib/health-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIMEOUT_MS = 6000;

export async function GET(req: NextRequest) {
  const authError = requireHealthAuth(req);
  if (authError) return authError;
  const startedAt = Date.now();

  let ok = false;
  let error: string | null = null;
  let domainCount: number | null = null;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "email",
        provider: "resend",
        error: "RESEND_API_KEY not configured",
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await Promise.race([
      resend.domains.list(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("resend_timeout")), TIMEOUT_MS),
      ),
    ]);

    if ("error" in result && result.error) {
      error = result.error.message ?? "resend_error";
    } else {
      ok = true;
      const data = "data" in result ? result.data : null;
      domainCount = data?.data?.length ?? 0;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown_error";
  }

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "email",
      provider: "resend",
      domainCount,
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
