import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { formatDiscountLearningMessage } from "@/lib/deals/conversion";
import { listPendingDealSuggestions } from "@/lib/deals/suggestions";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "aiDealSuggestions");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json([]);
    }
    throw error;
  }

  const suggestions = await listPendingDealSuggestions(businessId);
  return NextResponse.json(suggestions.map((item) => ({
    ...item,
    apptWindowStart: item.apptWindowStart.toISOString(),
    apptWindowEnd: item.apptWindowEnd.toISOString(),
    headline: item.reason,
    learningLine: item.meta && typeof item.meta === "object" && "adjustedDiscount" in item.meta
      ? formatDiscountLearningMessage(item.meta as Parameters<typeof formatDiscountLearningMessage>[0])
      : null,
  })));
}
