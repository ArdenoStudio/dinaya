import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead } from "@/app/api/v1/desktop/_shared";
import {
  getClientsDashboardList,
  isDashboardClientStageFilter,
  type DashboardClientStageFilter,
} from "@/lib/dashboard/clients";
import { withRateLimit } from "@/lib/rate-limit";

const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 150;

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(parsed)));
}

export async function GET(req: NextRequest) {
  const authResult = await requireDesktopRead(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-clients",
    limit: 180,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const params = req.nextUrl.searchParams;
  const stageParam = params.get("stage");
  if (stageParam && !isDashboardClientStageFilter(stageParam)) {
    return NextResponse.json({ error: "stage is invalid." }, { status: 400 });
  }

  const clients = await getClientsDashboardList(businessId, {
    limit: parseLimit(params.get("limit")),
    q: params.get("q")?.trim() ?? "",
    stage: (stageParam || "all") as DashboardClientStageFilter,
  });

  return NextResponse.json({
    ...clients,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/clients",
  });
}
