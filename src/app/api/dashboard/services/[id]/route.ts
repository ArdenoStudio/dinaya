import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function getSession() {
  const session = await auth();
  if (!session) return null;
  return { session, businessId: (session.user as { businessId: string }).businessId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSession();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [service] = await db
    .select({
      id: services.id,
      businessId: services.businessId,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceLkr: services.priceLkr,
      requiresPayment: services.requiresPayment,
      isActive: services.isActive,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
      dailyCapacity: services.dailyCapacity,
      createdAt: services.createdAt,
    })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, ctx.businessId)))
    .limit(1);

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSession();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, ctx.businessId)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowedFields = [
    "name", "description", "durationMinutes", "priceLkr",
    "requiresPayment", "isActive", "beforeBuffer", "afterBuffer",
    "minimumNoticeHours", "dailyCapacity",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      update[field] = body[field] === "" || body[field] === null ? null : body[field];
    }
  }

  const [updated] = await db
    .update(services)
    .set(update)
    .where(eq(services.id, id))
    .returning({
      id: services.id,
      businessId: services.businessId,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceLkr: services.priceLkr,
      requiresPayment: services.requiresPayment,
      isActive: services.isActive,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
      dailyCapacity: services.dailyCapacity,
      createdAt: services.createdAt,
    });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSession();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, ctx.businessId)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(services).where(eq(services.id, id));
  return NextResponse.json({ success: true });
}
