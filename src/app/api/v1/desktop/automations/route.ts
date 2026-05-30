import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead } from "@/app/api/v1/desktop/_shared";
import {
  getAutomationsDashboardList,
  isDashboardAutomationStatusFilter,
  type DashboardAutomationStatusFilter,
} from "@/lib/dashboard/automations";
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
    scope: "desktop-automations",
    limit: 180,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  try {
    await requirePro(businessId, "automations");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const params = req.nextUrl.searchParams;
  const statusParam = params.get("status");
  if (statusParam && !isDashboardAutomationStatusFilter(statusParam)) {
    return NextResponse.json({ error: "status is invalid." }, { status: 400 });
  }

  const automations = await getAutomationsDashboardList(businessId, {
    limit: parseLimit(params.get("limit")),
    q: params.get("q")?.trim() ?? "",
    status: (statusParam || "all") as DashboardAutomationStatusFilter,
  });

  return NextResponse.json({
    ...automations,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/automations",
  });
}
