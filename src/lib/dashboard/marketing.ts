import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  aiContentCalendar,
  bookings,
  businesses,
  locations,
  socialConnections,
} from "@/db/schema";
import { approveContentItem, publishContentItem } from "@/lib/ai/content";
import { buildPublicBookingUrl, getAppBaseUrl } from "@/lib/booking-url";

export const marketingToolIds = [
  "tool-booking-link",
  "tool-whatsapp-share",
  "tool-qr-poster",
  "tool-website-embed",
] as const;

export type MarketingToolId = (typeof marketingToolIds)[number];
export type MarketingContentAction = "approve" | "publish";
export type DashboardMarketingDetail = Awaited<ReturnType<typeof getMarketingDashboardDetail>>;

const marketingToolMeta: Record<MarketingToolId, { description: string; title: string }> = {
  "tool-booking-link": {
    description: "Copy and share the public booking page.",
    title: "Booking link",
  },
  "tool-whatsapp-share": {
    description: "Ready-to-send WhatsApp and social copy.",
    title: "WhatsApp share",
  },
  "tool-qr-poster": {
    description: "Counter, story, and poster QR assets.",
    title: "QR poster",
  },
  "tool-website-embed": {
    description: "Booking and reviews widgets for a website.",
    title: "Website embeds",
  },
};

function isMarketingToolId(value: string): value is MarketingToolId {
  return marketingToolIds.includes(value as MarketingToolId);
}

async function getMarketingContext(businessId: string) {
  const [[business], [referralSummary], connections] = await Promise.all([
    db
      .select({
        customDomain: businesses.customDomain,
        customDomainVerified: businesses.customDomainVerified,
        directoryCategory: businesses.directoryCategory,
        directoryCity: businesses.directoryCity,
        directoryDistrict: businesses.directoryDistrict,
        directoryListed: businesses.directoryListed,
        id: businesses.id,
        name: businesses.name,
        referralCode: businesses.referralCode,
        slug: businesses.slug,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    db
      .select({ value: count() })
      .from(bookings)
      .where(and(eq(bookings.businessId, businessId), eq(bookings.source, "referral"))),
    db
      .select({
        accountName: socialConnections.accountName,
        id: socialConnections.id,
        isActive: socialConnections.isActive,
        provider: socialConnections.provider,
      })
      .from(socialConnections)
      .where(eq(socialConnections.businessId, businessId))
      .orderBy(desc(socialConnections.updatedAt)),
  ]);

  if (!business) return null;

  const bookingUrl = buildPublicBookingUrl({
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
    slug: business.slug,
  });
  const encodedUrl = encodeURIComponent(bookingUrl);
  const appBaseUrl = getAppBaseUrl().replace(/\/$/, "");
  const whatsappSnippet = `Book your appointment online with ${business.name}: ${bookingUrl}`;
  const instagramSnippet = `${business.name} bookings are open. Tap the link in bio: ${bookingUrl}`;
  const embedSnippet = `<iframe src="${bookingUrl}" width="100%" height="720" style="border:0;border-radius:8px"></iframe>`;
  const reviewsEmbedUrl = `${appBaseUrl}/embed/reviews/${business.slug}`;

  return {
    business: {
      customDomain: business.customDomain,
      customDomainVerified: business.customDomainVerified,
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    directory: {
      category: business.directoryCategory,
      city: business.directoryCity,
      district: business.directoryDistrict,
      listed: business.directoryListed,
    },
    referral: {
      code: business.referralCode ?? business.slug,
      bookings: Number(referralSummary?.value ?? 0),
    },
    share: {
      bookingUrl,
      embedSnippet,
      instagramSnippet,
      qrPng: `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&format=png&data=${encodedUrl}`,
      qrSvg: `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&format=svg&data=${encodedUrl}`,
      reviewsEmbedSnippet: `<iframe src="${reviewsEmbedUrl}" width="100%" height="420" style="border:0;border-radius:8px"></iframe>`,
      reviewsEmbedUrl,
      whatsappSnippet,
    },
    socialConnections: connections.map((connection) => ({
      accountName: connection.accountName,
      id: connection.id,
      isActive: connection.isActive,
      provider: connection.provider,
    })),
  };
}

export async function getMarketingDashboardDetail(businessId: string, marketingId: string) {
  const context = await getMarketingContext(businessId);
  if (!context) return null;

  if (isMarketingToolId(marketingId)) {
    const tool = marketingToolMeta[marketingId];
    return {
      kind: "share_tool" as const,
      ...context,
      tool: {
        description: tool.description,
        id: marketingId,
        title: tool.title,
      },
    };
  }

  const [content] = await db
    .select({
      approvedAt: aiContentCalendar.approvedAt,
      caption: aiContentCalendar.caption,
      channel: aiContentCalendar.channel,
      contentDate: aiContentCalendar.contentDate,
      createdAt: aiContentCalendar.createdAt,
      error: aiContentCalendar.error,
      id: aiContentCalendar.id,
      locationId: locations.id,
      locationName: locations.name,
      locationTimezone: locations.timezone,
      meta: aiContentCalendar.meta,
      provider: aiContentCalendar.provider,
      providerMessageId: aiContentCalendar.providerMessageId,
      publishedAt: aiContentCalendar.publishedAt,
      status: aiContentCalendar.status,
      title: aiContentCalendar.title,
      updatedAt: aiContentCalendar.updatedAt,
    })
    .from(aiContentCalendar)
    .innerJoin(locations, eq(aiContentCalendar.locationId, locations.id))
    .where(and(eq(aiContentCalendar.id, marketingId), eq(aiContentCalendar.businessId, businessId)))
    .limit(1);

  if (!content) return null;

  return {
    kind: "content" as const,
    ...context,
    content: {
      approvedAt: content.approvedAt?.toISOString() ?? null,
      caption: content.caption,
      channel: content.channel,
      contentDate: content.contentDate,
      createdAt: content.createdAt.toISOString(),
      error: content.error,
      id: content.id,
      meta: content.meta,
      provider: content.provider,
      providerMessageId: content.providerMessageId,
      publishedAt: content.publishedAt?.toISOString() ?? null,
      status: content.status,
      title: content.title,
      updatedAt: content.updatedAt.toISOString(),
    },
    location: {
      id: content.locationId,
      name: content.locationName,
      timezone: content.locationTimezone,
    },
    workflow: {
      canApprove: content.status === "draft",
      canPublish: content.status === "approved" || content.status === "published",
    },
  };
}

export async function updateMarketingContentAction(
  businessId: string,
  marketingId: string,
  action: MarketingContentAction,
) {
  if (action === "approve") {
    return approveContentItem(businessId, marketingId);
  }

  return publishContentItem(businessId, marketingId);
}
