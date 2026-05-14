import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  const { name, description, durationMinutes, priceLkr, requiresPayment, beforeBuffer, afterBuffer, minimumNoticeHours, dailyCapacity } = await req.json();

  if (!name || !durationMinutes) {
    return NextResponse.json({ error: "Name and duration are required." }, { status: 400 });
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
      beforeBuffer: beforeBuffer ?? 0,
      afterBuffer: afterBuffer ?? 0,
      minimumNoticeHours: minimumNoticeHours ?? 0,
      dailyCapacity: dailyCapacity ? parseInt(dailyCapacity) : null,
    })
    .returning({ id: services.id });

  return NextResponse.json({ id: service.id }, { status: 201 });
}
