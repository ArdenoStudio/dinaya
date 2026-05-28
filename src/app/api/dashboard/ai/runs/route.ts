import {NextResponse, NextRequest} from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { getAiWorkflowRunsDashboardList } from "@/lib/dashboard/ai";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "aiBookingAutopilot");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const runs = await getAiWorkflowRunsDashboardList(businessId, { limit: 100 });

  return NextResponse.json({ runs: runs.rows });
}
