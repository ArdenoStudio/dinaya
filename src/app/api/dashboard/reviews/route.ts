import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { getReviewsDashboardList } from "@/lib/dashboard/reviews";
import { PlanRequiredError, requirePro } from "@/lib/plan";

async function requireReviews(businessId: string): Promise<NextResponse | null> {
  try {
    await requirePro(businessId, "reviews");
    return null;
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json(
        { error: error.message, feature: "reviews" },
        { status: 402 },
      );
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireReviews(businessId);
  if (accessError) return accessError;

  const { rows } = await getReviewsDashboardList(businessId, { limit: 200 });

  return NextResponse.json(rows);
}
