import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { inferDirectoryCategory } from "@/lib/directory";
import { logActivity } from "@/lib/activity-log";
import { trackPlatformEvent } from "@/lib/platform-events";
import { z } from "@/lib/validation";

const directorySchema = z.object({
  directoryListed: z.boolean(),
  directoryCity: z.string().trim().max(80).optional().nullable(),
  directoryDistrict: z.string().trim().max(80).optional().nullable(),
  directoryCategory: z.string().trim().max(80).optional().nullable(),
});

export async function GET() {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;

  const [business] = await db
    .select({
      directoryListed: businesses.directoryListed,
      directoryCity: businesses.directoryCity,
      directoryDistrict: businesses.directoryDistrict,
      directoryCategory: businesses.directoryCategory,
      businessType: businesses.businessType,
      address: businesses.address,
    })
    .from(businesses)
    .where(eq(businesses.id, authResult.context.businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...business,
    suggestedCategory: inferDirectoryCategory(business.businessType),
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;

  const parsed = directorySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your directory settings.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (parsed.data.directoryListed && !parsed.data.directoryCity) {
    return NextResponse.json({ error: "Choose a city before listing on the directory." }, { status: 400 });
  }

  await db
    .update(businesses)
    .set({
      directoryListed: parsed.data.directoryListed,
      directoryCity: parsed.data.directoryCity || null,
      directoryDistrict: parsed.data.directoryDistrict || null,
      directoryCategory: parsed.data.directoryCategory || inferDirectoryCategory(null),
    })
    .where(eq(businesses.id, authResult.context.businessId));

  void logActivity({
    action: "updated",
    actorUserId: authResult.context.user.id,
    businessId: authResult.context.businessId,
    entity: "business",
    entityId: authResult.context.businessId,
    meta: { section: "directory", listed: parsed.data.directoryListed },
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });
  void trackPlatformEvent({
    businessId: authResult.context.businessId,
    event: "directory.listing_changed",
    props: {
      category: parsed.data.directoryCategory ?? null,
      city: parsed.data.directoryCity ?? null,
      listed: parsed.data.directoryListed,
    },
    userId: authResult.context.user.id,
  });

  return NextResponse.json({ ok: true });
}
