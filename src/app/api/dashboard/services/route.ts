import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";
import { trackPlatformEvent } from "@/lib/platform-events";
import { serviceCreateSchema } from "@/lib/schemas/services";

export async function GET() {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

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
  const authResult = await requireApiBusiness({ ownerOnly: true });
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
      void trackPlatformEvent({
        businessId,
        event: "plan.limit_blocked",
        props: { limit: "services", max: error.max },
      });
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

  void trackPlatformEvent({
    businessId,
    event: "activation.step_completed",
    props: { serviceId: service.id, step: "service_created" },
  });

  return NextResponse.json({ id: service.id }, { status: 201 });
}
