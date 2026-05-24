import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiWorkflowRuns } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function GET() {
  const authResult = await requireApiBusiness();
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

  const runs = await db
    .select()
    .from(aiWorkflowRuns)
    .where(eq(aiWorkflowRuns.businessId, businessId))
    .orderBy(desc(aiWorkflowRuns.createdAt))
    .limit(100);

  return NextResponse.json({ runs });
}
