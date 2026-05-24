import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  countLocations,
  getStaffLocationMap,
  requireCanAddLocation,
  slugifyLocationName,
} from "@/lib/locations";
import { PlanLimitError } from "@/lib/plan";
import { z } from "@/lib/validation";

const locationCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  address: z.string().trim().max(1000).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  timezone: z.string().trim().min(1).max(80).default("Asia/Colombo"),
  slug: z.string().trim().max(50).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const rows = await db
    .select()
    .from(locations)
    .where(eq(locations.businessId, businessId))
    .orderBy(locations.sortOrder, locations.name);

  const staffMap = await getStaffLocationMap(businessId);
  const staffCountByLocation = new Map<string, number>();
  for (const row of staffMap) {
    staffCountByLocation.set(row.locationId, (staffCountByLocation.get(row.locationId) ?? 0) + 1);
  }

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      staffCount: staffCountByLocation.get(row.id) ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = locationCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the location details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await requireCanAddLocation(businessId);
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        { error: "Your plan has reached the location limit. Upgrade to add more branches." },
        { status: 402 }
      );
    }
    throw error;
  }

  const { name, address, phone, timezone, isActive } = parsed.data;
  const existingCount = await countLocations(businessId);
  const baseSlug = parsed.data.slug?.trim() || slugifyLocationName(name) || "branch";
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const [conflict] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.slug, slug)))
      .limit(1);
    if (!conflict) break;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const [created] = await db
    .insert(locations)
    .values({
      businessId,
      name,
      slug,
      address: address || null,
      phone: phone || null,
      timezone,
      isActive,
      isDefault: existingCount === 0,
      sortOrder: existingCount,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
