import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";
import {
  getServicesDashboardList,
  isDashboardServiceStatusFilter,
  type DashboardServiceStatusFilter,
} from "@/lib/dashboard/services";
import { serviceCreateSchema } from "@/lib/schemas/services";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(parsed)));
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const params = req.nextUrl.searchParams;
  const statusParam = params.get("status");
  if (statusParam && !isDashboardServiceStatusFilter(statusParam)) {
    return NextResponse.json({ error: "status is invalid." }, { status: 400 });
  }

  const { rows } = await getServicesDashboardList(businessId, {
    limit: parseLimit(params.get("limit")),
    q: params.get("q")?.trim() ?? "",
    status: (statusParam || "all") as DashboardServiceStatusFilter,
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = serviceCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the service details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [{ value: serviceCount }] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.businessId, businessId));

  try {
    await requirePlanLimit(businessId, "services", Number(serviceCount));
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        { error: "Free businesses can publish up to 5 services. Upgrade to Pro for unlimited services." },
        { status: 402 },
      );
    }
    throw error;
  }

  const data = parsed.data;
  const [service] = await db
    .insert(services)
    .values({
      businessId,
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      priceLkr: data.priceLkr ?? 0,
      requiresPayment: !!data.requiresPayment,
      depositPercent: data.depositPercent ?? 0,
      beforeBuffer: data.beforeBuffer ?? 0,
      afterBuffer: data.afterBuffer ?? 0,
      minimumNoticeHours: data.minimumNoticeHours ?? 0,
      dailyCapacity: data.dailyCapacity ?? null,
    })
    .returning({ id: services.id });

  return NextResponse.json({ id: service.id }, { status: 201 });
}
