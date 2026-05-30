import { and, count, desc, eq, sql } from "drizzle-orm";
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
export type DashboardMarketingList = Awaited<ReturnType<typeof getMarketingDashboardList>>;
export type DashboardMarketingStatusFilter =
  | "all"
  | "approved"
  | "draft"
  | "failed"
  | "published"
  | "tools";

export const dashboardMarketingStatusFilters = [
  "all",
  "tools",
  "draft",
  "approved",
  "published",
  "failed",
] as const;

export type DashboardMarketingListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardMarketingStatusFilter;
};

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

const DEFAULT_MARKETING_LIMIT = 80;
const MAX_MARKETING_LIMIT = 150;

export function isMarketingToolId(value: string): value is MarketingToolId {
  return marketingToolIds.includes(value as MarketingToolId);
}

export function isDashboardMarketingStatusFilter(value: string): value is DashboardMarketingStatusFilter {
  return dashboardMarketingStatusFilters.includes(value as DashboardMarketingStatusFilter);
}

function normalizeMarketingLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_MARKETING_LIMIT;
  return Math.min(MAX_MARKETING_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_MARKETING_LIMIT)));
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

export async function getMarketingDashboardList(
  businessId: string,
  options: DashboardMarketingListOptions = {},
) {
  const context = await getMarketingContext(businessId);
  if (!context) return null;

  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeMarketingLimit(options.limit);
  const [summaryRows, contentRows] = await Promise.all([
    db
      .select({
        approvedContent: sql<number>`coalesce(count(*) filter (where ${aiContentCalendar.status} = 'approved'), 0)::int`,
        draftContent: sql<number>`coalesce(count(*) filter (where ${aiContentCalendar.status} = 'draft'), 0)::int`,
        failedContent: sql<number>`coalesce(count(*) filter (where ${aiContentCalendar.status} = 'failed'), 0)::int`,
        publishedContent: sql<number>`coalesce(count(*) filter (where ${aiContentCalendar.status} = 'published'), 0)::int`,
        totalContent: count(),
      })
      .from(aiContentCalendar)
      .where(eq(aiContentCalendar.businessId, businessId)),
    db
      .select({
        channel: aiContentCalendar.channel,
        contentDate: aiContentCalendar.contentDate,
        id: aiContentCalendar.id,
        locationName: locations.name,
        status: aiContentCalendar.status,
        title: aiContentCalendar.title,
        updatedAt: aiContentCalendar.updatedAt,
      })
      .from(aiContentCalendar)
      .innerJoin(locations, eq(aiContentCalendar.locationId, locations.id))
      .where(eq(aiContentCalendar.businessId, businessId))
      .orderBy(desc(aiContentCalendar.contentDate), desc(aiContentCalendar.updatedAt))
      .limit(MAX_MARKETING_LIMIT),
  ]);

  const toolRows = marketingToolIds.map((toolId) => {
    const meta = marketingToolMeta[toolId];
    return {
      channel: "tool",
      contentDate: null,
      id: toolId,
      kind: "share_tool" as const,
      locationName: null,
      status: "tool",
      statusLabel: "Tool",
      subtitle: meta.description,
      title: meta.title,
      updatedAt: null,
    };
  });

  const content = contentRows.map((row) => ({
    channel: row.channel,
    contentDate: row.contentDate,
    id: row.id,
    kind: "content" as const,
    locationName: row.locationName,
    status: row.status,
    statusLabel: row.status.replaceAll("_", " "),
    subtitle: `${row.channel} · ${row.locationName}`,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }));

  const allRows = [...toolRows, ...content];
  const filteredRows = allRows.filter((row) => {
    const statusMatch = status === "all"
      || (status === "tools" ? row.kind === "share_tool" : row.kind === "content" && row.status === status);
    const queryMatch = !query || [
      row.channel,
      row.contentDate ?? "",
      row.locationName ?? "",
      row.status,
      row.subtitle,
      row.title,
    ].some((value) => value.toLowerCase().includes(query));
    return statusMatch && queryMatch;
  });
  const summary = summaryRows[0];

  return {
    business: context.business,
    directory: context.directory,
    filters: {
      limit,
      q: query,
      status,
    },
    referral: context.referral,
    rows: filteredRows.slice(0, limit),
    share: context.share,
    socialConnections: context.socialConnections,
    summary: {
      approvedContent: Number(summary?.approvedContent ?? 0),
      draftContent: Number(summary?.draftContent ?? 0),
      failedContent: Number(summary?.failedContent ?? 0),
      publishedContent: Number(summary?.publishedContent ?? 0),
      socialConnections: context.socialConnections.length,
      tools: marketingToolIds.length,
      totalContent: Number(summary?.totalContent ?? 0),
    },
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
