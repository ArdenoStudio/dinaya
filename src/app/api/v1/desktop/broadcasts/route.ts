import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead } from "@/app/api/v1/desktop/_shared";
import {
  getBroadcastsDashboardList,
  isDashboardBroadcastChannelFilter,
  isDashboardBroadcastStatusFilter,
  type DashboardBroadcastChannelFilter,
  type DashboardBroadcastStatusFilter,
} from "@/lib/dashboard/broadcasts";
import { PlanRequiredError, requirePro } from "@/lib/plan";
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
    scope: "desktop-broadcasts",
    limit: 180,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  try {
    await requirePro(businessId, "broadcasts");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const params = req.nextUrl.searchParams;
  const statusParam = params.get("status");
  if (statusParam && !isDashboardBroadcastStatusFilter(statusParam)) {
    return NextResponse.json({ error: "status is invalid." }, { status: 400 });
  }

  const channelParam = params.get("channel");
  if (channelParam && !isDashboardBroadcastChannelFilter(channelParam)) {
    return NextResponse.json({ error: "channel is invalid." }, { status: 400 });
  }

  const broadcasts = await getBroadcastsDashboardList(businessId, {
    channel: (channelParam || "all") as DashboardBroadcastChannelFilter,
    limit: parseLimit(params.get("limit")),
    q: params.get("q")?.trim() ?? "",
    status: (statusParam || "all") as DashboardBroadcastStatusFilter,
  });

  return NextResponse.json({
    ...broadcasts,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/broadcasts",
  });
}
