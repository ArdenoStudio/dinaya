import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const list = await db
    .select({
      id: services.id,
      name: services.name,
      durationMinutes: services.durationMinutes,
      priceLkr: services.priceLkr,
      depositPercent: services.depositPercent,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
    })
    .from(services)
    .where(eq(services.businessId, businessId));

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const { name, description, durationMinutes, priceLkr, requiresPayment, depositPercent, beforeBuffer, afterBuffer, minimumNoticeHours, dailyCapacity } = await req.json();

  if (!name || !durationMinutes) {
    return NextResponse.json({ error: "Name and duration are required." }, { status: 400 });
  }

  const [{ value: serviceCount }] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.businessId, businessId));
  try {
    await requirePlanLimit(businessId, "services", Number(serviceCount));
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json({ error: "Free businesses can publish up to 5 services. Upgrade to Pro for unlimited services." }, { status: 402 });
    }
    throw error;
  }

  const [service] = await db
    .insert(services)
    .values({
      businessId,
      name,
      description,
      durationMinutes,
      priceLkr: priceLkr ?? 0,
      requiresPayment: !!requiresPayment,
      depositPercent: Math.min(100, Math.max(0, Number(depositPercent) || 0)),
      beforeBuffer: beforeBuffer ?? 0,
      afterBuffer: afterBuffer ?? 0,
      minimumNoticeHours: minimumNoticeHours ?? 0,
      dailyCapacity: dailyCapacity ? parseInt(dailyCapacity) : null,
    })
    .returning({ id: services.id });

  return NextResponse.json({ id: service.id }, { status: 201 });
}
