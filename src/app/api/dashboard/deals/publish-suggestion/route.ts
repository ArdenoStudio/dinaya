import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { db } from "@/db";
import { dealSuggestions, deals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { dealPublishFromSuggestionSchema } from "@/lib/deals/schema";
import { notifyDealAudience } from "@/lib/deals/notify";
import { updateDealSuggestionStatus } from "@/lib/deals/suggestions";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "aiDealSuggestions");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = dealPublishFromSuggestionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const [suggestion] = await db
    .select()
    .from(dealSuggestions)
    .where(and(
      eq(dealSuggestions.id, parsed.data.suggestionId),
      eq(dealSuggestions.businessId, businessId),
      eq(dealSuggestions.status, "pending"),
    ))
    .limit(1);

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
  }

  const now = new Date();
  const dealWindowEnd = addDays(now, 7);

  const [deal] = await db
    .insert(deals)
    .values({
      businessId,
      locationId: suggestion.locationId,
      serviceId: suggestion.serviceId,
      staffId: suggestion.staffId,
      discountPercent: suggestion.suggestedDiscountPercent,
      slotsTotal: suggestion.suggestedSlotsTotal,
      dealWindowStart: now,
      dealWindowEnd,
      apptWindowStart: suggestion.apptWindowStart,
      apptWindowEnd: suggestion.apptWindowEnd,
      status: "active",
    })
    .returning({ id: deals.id });

  await updateDealSuggestionStatus(businessId, suggestion.id, "accepted");

  void logActivity({
    businessId,
    entity: "deal",
    entityId: deal.id,
    action: "created",
    meta: { suggestionId: suggestion.id, source: "ai_suggestion" },
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });

  let notified = 0;
  if (parsed.data.notifyClients) {
    try {
      await requirePro(businessId, "whatsappSms");
      const notifyResult = await notifyDealAudience({
        businessId,
        dealId: deal.id,
        audience: "past_clients",
      });
      notified = notifyResult.sentCount;
    } catch {
      // notify is optional
    }
  }

  return NextResponse.json({ id: deal.id, notified }, { status: 201 });
}
