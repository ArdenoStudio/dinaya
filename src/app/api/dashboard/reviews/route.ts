import {NextResponse, NextRequest} from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { getReviewsDashboardList } from "@/lib/dashboard/reviews";

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const { rows } = await getReviewsDashboardList(businessId, { limit: 200 });

  return NextResponse.json(rows);
}
