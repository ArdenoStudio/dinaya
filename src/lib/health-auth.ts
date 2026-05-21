import { NextRequest, NextResponse } from "next/server";

export function requireHealthAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.HEALTH_CHECK_SECRET ?? process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Health checks are not configured." }, { status: 503 });
    }
    return null;
  }

  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-health-secret");

  if (bearer === secret || headerSecret === secret) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
