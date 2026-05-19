import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { canUseFeature, getBusinessPlan } from "@/lib/plan";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  const plan = await getBusinessPlan(businessId);
  if (!canUseFeature(plan, "webhooks")) {
    return NextResponse.json(
      { error: "Webhooks require the Pro plan.", feature: "webhooks" },
      { status: 402 },
    );
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ("isActive" in body) update.isActive = body.isActive;
  if ("url" in body) update.url = body.url;
  if ("events" in body) update.events = body.events;

  const [updated] = await db
    .update(webhooks)
    .set(update)
    .where(and(eq(webhooks.id, id), eq(webhooks.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.businessId, businessId)));
  return NextResponse.json({ success: true });
}
