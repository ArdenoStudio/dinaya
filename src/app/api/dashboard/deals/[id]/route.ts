import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { dealCancelSchema, dealUpdateSchema } from "@/lib/deals/schema";
import { DealValidationError, validateDealUpdate } from "@/lib/deals/validation";
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

  const body = await req.json().catch(() => ({}));

  const cancelParsed = dealCancelSchema.safeParse(body);
  if (cancelParsed.success) {
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

  const updateParsed = dealUpdateSchema.safeParse(body);
  if (!updateParsed.success) {
    return NextResponse.json(
      { error: "Invalid update.", fieldErrors: updateParsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select()
    .from(deals)
    .where(and(eq(deals.id, id), eq(deals.businessId, businessId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const updates = {
    dealWindowEnd: updateParsed.data.dealWindowEnd
      ? new Date(updateParsed.data.dealWindowEnd)
      : undefined,
    apptWindowEnd: updateParsed.data.apptWindowEnd
      ? new Date(updateParsed.data.apptWindowEnd)
      : undefined,
    slotsTotal: updateParsed.data.slotsTotal,
  };

  try {
    validateDealUpdate(existing, updates);
  } catch (error) {
    if (error instanceof DealValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const nextSlotsTotal = updates.slotsTotal ?? existing.slotsTotal;
  const nextStatus = existing.status === "sold_out" && nextSlotsTotal > existing.slotsRedeemed
    ? "active"
    : existing.status;

  const [updated] = await db
    .update(deals)
    .set({
      dealWindowEnd: updates.dealWindowEnd ?? existing.dealWindowEnd,
      apptWindowEnd: updates.apptWindowEnd ?? existing.apptWindowEnd,
      slotsTotal: nextSlotsTotal,
      status: nextStatus,
    })
    .where(eq(deals.id, id))
    .returning({
      id: deals.id,
      dealWindowEnd: deals.dealWindowEnd,
      apptWindowEnd: deals.apptWindowEnd,
      slotsTotal: deals.slotsTotal,
      status: deals.status,
    });

  void logActivity({
    businessId,
    entity: "deal",
    entityId: id,
    action: "updated",
    meta: updates,
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });

  return NextResponse.json(updated);
}
