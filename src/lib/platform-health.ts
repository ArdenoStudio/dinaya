import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

export type PlatformHealthStatus = "up" | "down" | "degraded";

export type PlatformHealthCheck = {
  id: string;
  name: string;
  status: PlatformHealthStatus;
  latencyMs: number | null;
  error?: string | null;
  provider?: string;
  details?: Record<string, string | number | boolean | null>;
};

const DB_TIMEOUT_MS = 8000;
const HTTP_TIMEOUT_MS = 6000;

export async function checkDatabaseHealth(): Promise<PlatformHealthCheck> {
  const startedAt = Date.now();
  let latencyMs: number | null = null;
  let error: string | null = null;

  if (!process.env.DATABASE_URL) {
    return {
      id: "database",
      name: "Database",
      status: "degraded",
      latencyMs: null,
      error: "DATABASE_URL not configured",
      provider: "neon",
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const t0 = Date.now();
    await Promise.race([
      sql`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db_timeout")), DB_TIMEOUT_MS),
      ),
    ]);
    latencyMs = Date.now() - t0;
    return {
      id: "database",
      name: "Database",
      status: "up",
      latencyMs,
      provider: "neon",
    };
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown_error";
    return {
      id: "database",
      name: "Database",
      status: "down",
      latencyMs: Date.now() - startedAt,
      error,
      provider: "neon",
    };
  }
}

export async function checkEmailHealth(): Promise<PlatformHealthCheck> {
  const startedAt = Date.now();

  if (!process.env.RESEND_API_KEY) {
    return {
      id: "email",
      name: "Email",
      status: "degraded",
      latencyMs: null,
      error: "RESEND_API_KEY not configured",
      provider: "resend",
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const t0 = Date.now();
    const result = await Promise.race([
      resend.domains.list(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("resend_timeout")), HTTP_TIMEOUT_MS),
      ),
    ]);
    const latencyMs = Date.now() - t0;

    if ("error" in result && result.error) {
      return {
        id: "email",
        name: "Email",
        status: "down",
        latencyMs,
        error: result.error.message ?? "resend_error",
        provider: "resend",
      };
    }

    const data = "data" in result ? result.data : null;
    const domainCount = data?.data?.length ?? 0;

    return {
      id: "email",
      name: "Email",
      status: "up",
      latencyMs,
      provider: "resend",
      details: { domainCount },
    };
  } catch (err) {
    return {
      id: "email",
      name: "Email",
      status: "down",
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : "unknown_error",
      provider: "resend",
    };
  }
}

export async function checkPaymentsHealth(): Promise<PlatformHealthCheck> {
  const startedAt = Date.now();
  const sandbox = process.env.PAYHERE_SANDBOX === "true";
  const url = sandbox ? "https://sandbox.payhere.lk/" : "https://www.payhere.lk/";

  try {
    const t0 = Date.now();
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: { "User-Agent": "Dinaya-HealthCheck/1.0" },
    });
    const latencyMs = Date.now() - t0;
    const ok = res.status < 500 && res.status !== 0;

    return {
      id: "payments",
      name: "Payments",
      status: ok ? "up" : "degraded",
      latencyMs,
      provider: "payhere",
      details: {
        mode: sandbox ? "sandbox" : "production",
        upstreamStatus: res.status,
      },
      error: ok ? null : `upstream_status_${res.status}`,
    };
  } catch (err) {
    return {
      id: "payments",
      name: "Payments",
      status: "down",
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.name : "unknown_error",
      provider: "payhere",
      details: { mode: sandbox ? "sandbox" : "production" },
    };
  }
}

/** Live probes for DB, email, and PayHere — used by /admin/health and /api/health/*. */
export async function runPlatformHealthChecks(): Promise<PlatformHealthCheck[]> {
  const [database, email, payments] = await Promise.all([
    checkDatabaseHealth(),
    checkEmailHealth(),
    checkPaymentsHealth(),
  ]);
  return [database, email, payments];
}
