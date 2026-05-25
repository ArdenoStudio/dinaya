import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { PlanRequiredError, requirePro } from "@/lib/plan";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  try {
    await requirePro(businessId, "deals");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const [existing] = await db
    .select({ id: deals.id, status: deals.status })
    .from(deals)
    .where(and(eq(deals.id, id), eq(deals.businessId, businessId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "Deal is already cancelled." }, { status: 400 });
  }

  await db
    .update(deals)
    .set({ status: "cancelled" })
    .where(eq(deals.id, id));

  void logActivity({
    businessId,
    entity: "deal",
    entityId: id,
    action: "cancelled",
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });

  return NextResponse.json({ ok: true });
}
