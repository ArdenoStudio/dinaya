import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { getUpsellRecommendation } from "@/lib/ai/upsell";
import { parseLocationAiConfig } from "@/lib/locations";
import { canUseFeature, getBusinessPlan } from "@/lib/plan";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "ai-upsell",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;
  const businessId = req.nextUrl.searchParams.get("businessId");
  const serviceId = req.nextUrl.searchParams.get("serviceId");
  const locationId = req.nextUrl.searchParams.get("locationId");

  if (!businessId || !serviceId) {
    return NextResponse.json({ recommendation: null });
  }

  // Resolve the effective plan so a lapsed trial / expired business loses access
  // (the raw stored plan would still read "trial"/"max" after expiry).
  const plan = await getBusinessPlan(businessId);
  if (!canUseFeature(plan, "aiUpsellAssistant")) {
    return NextResponse.json({ recommendation: null });
  }

  if (locationId) {
    const [location] = await db
      .select({ aiConfig: locations.aiConfig })
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.businessId, businessId)))
      .limit(1);
    if (!parseLocationAiConfig(location?.aiConfig).aiUpsellAssistant) {
      return NextResponse.json({ recommendation: null });
    }
  }

  const recommendation = await getUpsellRecommendation({ businessId, serviceId });
  return NextResponse.json({ recommendation });
}
