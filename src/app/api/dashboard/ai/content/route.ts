import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { generateThirtyDayContentCalendar, listContentCalendar } from "@/lib/ai/content";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withDashboardRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const contentRequestSchema = z.object({
  locationId: z.uuid().optional(),
});

async function requireAiContentAccess(businessId: string) {
  try {
    await requirePro(businessId, "aiContentMachine");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }
  return null;
}

async function resolveLocation(businessId: string, requestedLocationId?: string) {
  if (requestedLocationId) {
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(
        eq(locations.id, requestedLocationId),
        eq(locations.businessId, businessId),
        eq(locations.isActive, true),
      ))
      .limit(1);
    return location?.id ?? null;
  }

  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)))
    .orderBy(asc(locations.sortOrder), asc(locations.name))
    .limit(1);
  return location?.id ?? null;
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const accessError = await requireAiContentAccess(businessId);
  if (accessError) return accessError;

  const locationId = req.nextUrl.searchParams.get("locationId") ?? undefined;
  const rows = await listContentCalendar(businessId, locationId);
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const rateLimit = await withDashboardRateLimit(req, businessId);
  if (!rateLimit.ok) return rateLimit.response;

  const accessError = await requireAiContentAccess(businessId);
  if (accessError) return accessError;

  const parsed = contentRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content request." }, { status: 400 });
  }

  const locationId = await resolveLocation(businessId, parsed.data.locationId);
  if (!locationId) return NextResponse.json({ error: "No active branch found." }, { status: 404 });

  const items = await generateThirtyDayContentCalendar({ businessId, locationId });
  return NextResponse.json({ items }, { status: 201 });
}
