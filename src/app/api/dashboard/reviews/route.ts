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

  const cursorParam = new URL(req.url).searchParams.get("cursor");
  const cursor = cursorParam ? new Date(cursorParam) : null;
  if (cursorParam && Number.isNaN(cursor?.getTime())) {
    return NextResponse.json({ error: "cursor must be a valid ISO datetime." }, { status: 400 });
  }

  const { rows, hasMore, nextCursor, summary } = await getReviewsDashboardList(businessId, {
    limit: 80,
    cursor: cursor && !Number.isNaN(cursor.getTime()) ? cursor : null,
  });

  return NextResponse.json({ reviews: rows, hasMore, nextCursor, summary });
}
