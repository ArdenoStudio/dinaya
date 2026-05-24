import { addDays, format } from "date-fns";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { aiContentCalendar, businesses, locations } from "@/db/schema";
import { generateAiCopy } from "@/lib/ai/copy";
import { publishSocialPost } from "@/lib/ai/providers";

export async function generateThirtyDayContentCalendar(input: {
  businessId: string;
  locationId: string;
  startDate?: Date;
}) {
  const startDate = input.startDate ?? new Date();
  const [[business], [location]] = await Promise.all([
    db
      .select({ name: businesses.name, slug: businesses.slug, businessType: businesses.businessType })
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1),
    db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(and(eq(locations.id, input.locationId), eq(locations.businessId, input.businessId)))
      .limit(1),
  ]);

  if (!business || !location) throw new Error("Business or branch not found.");

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/book/${business.slug}`;
  const rows = [];
  for (let index = 0; index < 30; index++) {
    const contentDate = format(addDays(startDate, index), "yyyy-MM-dd");
    const copy = await generateAiCopy({
      businessName: business.name,
      feature: "aiContentMachine",
      bookingUrl,
      locationName: location.name,
      extra: business.businessType ?? undefined,
    });

    rows.push({
      businessId: input.businessId,
      locationId: input.locationId,
      contentDate,
      channel: "social",
      title: `Day ${index + 1}: ${business.name} booking prompt`,
      caption: copy.body,
      status: "draft",
      meta: { source: copy.source, generatedFor: location.name },
    });
  }

  await db
    .insert(aiContentCalendar)
    .values(rows)
    .onConflictDoNothing({
      target: [
        aiContentCalendar.businessId,
        aiContentCalendar.locationId,
        aiContentCalendar.contentDate,
      ],
    });

  return listContentCalendar(input.businessId, input.locationId);
}

export async function listContentCalendar(businessId: string, locationId?: string) {
  const start = format(new Date(), "yyyy-MM-dd");
  const end = format(addDays(new Date(), 45), "yyyy-MM-dd");
  return db
    .select()
    .from(aiContentCalendar)
    .where(and(
      eq(aiContentCalendar.businessId, businessId),
      locationId ? eq(aiContentCalendar.locationId, locationId) : undefined,
      gte(aiContentCalendar.contentDate, start),
      lte(aiContentCalendar.contentDate, end),
    ))
    .orderBy(asc(aiContentCalendar.contentDate), asc(aiContentCalendar.createdAt));
}

export async function approveContentItem(businessId: string, id: string) {
  const [item] = await db
    .update(aiContentCalendar)
    .set({ status: "approved", approvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(aiContentCalendar.id, id), eq(aiContentCalendar.businessId, businessId)))
    .returning();
  return item ?? null;
}

export async function publishContentItem(businessId: string, id: string) {
  const [item] = await db
    .select()
    .from(aiContentCalendar)
    .where(and(eq(aiContentCalendar.id, id), eq(aiContentCalendar.businessId, businessId)))
    .limit(1);

  if (!item) return null;
  if (item.status !== "approved" && item.status !== "published") {
    throw new Error("Approve this content before publishing.");
  }
  if (item.status === "published") return item;

  const result = await publishSocialPost({
    caption: item.caption,
    idempotencyKey: `content:${item.id}`,
  });

  const [updated] = await db
    .update(aiContentCalendar)
    .set({
      status: result.status === "sent" ? "published" : result.status,
      publishedAt: result.status === "sent" ? new Date() : null,
      provider: result.provider,
      providerMessageId: result.providerMessageId ?? null,
      error: result.error ?? null,
      updatedAt: new Date(),
    })
    .where(eq(aiContentCalendar.id, item.id))
    .returning();

  return updated ?? null;
}
