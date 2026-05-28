import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, locations, reviews, services, staff } from "@/db/schema";

export type DashboardReviewDetail = Awaited<ReturnType<typeof getReviewDashboardDetail>>;
export type DashboardReviewList = Awaited<ReturnType<typeof getReviewsDashboardList>>;
export type DashboardReviewStatusFilter = "all" | "hidden" | "needs_reply" | "published" | "replied";

export type DashboardReviewUpdate = {
  isPublished?: boolean;
  ownerReply?: string | null;
};

export type DashboardReviewsListOptions = {
  limit?: number;
  q?: string;
  rating?: number | null;
  status?: DashboardReviewStatusFilter;
};

const DEFAULT_REVIEW_LIMIT = 80;
const MAX_REVIEW_LIMIT = 150;

export const dashboardReviewStatusFilters = ["all", "published", "hidden", "needs_reply", "replied"] as const;

function normalizeReviewLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_REVIEW_LIMIT;
  return Math.min(MAX_REVIEW_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_REVIEW_LIMIT)));
}

export function isDashboardReviewStatusFilter(value: string): value is DashboardReviewStatusFilter {
  return dashboardReviewStatusFilters.includes(value as DashboardReviewStatusFilter);
}

export async function getReviewsDashboardList(
  businessId: string,
  options: DashboardReviewsListOptions = {},
) {
  const query = options.q?.trim() ?? "";
  const limit = normalizeReviewLimit(options.limit);
  const rating = options.rating && options.rating >= 1 && options.rating <= 5 ? Math.round(options.rating) : null;
  const status = options.status ?? "all";

  const baseFilters = [eq(reviews.businessId, businessId)];
  const filters = [
    ...baseFilters,
    ...(status === "published" ? [eq(reviews.isPublished, true)] : []),
    ...(status === "hidden" ? [eq(reviews.isPublished, false)] : []),
    ...(status === "needs_reply"
      ? [sql`(${reviews.ownerReply} is null or length(trim(${reviews.ownerReply})) = 0)`]
      : []),
    ...(status === "replied"
      ? [sql`(${reviews.ownerReply} is not null and length(trim(${reviews.ownerReply})) > 0)`]
      : []),
    ...(rating ? [eq(reviews.rating, rating)] : []),
    ...(query
      ? [
          or(
            ilike(reviews.clientName, `%${query}%`),
            ilike(reviews.comment, `%${query}%`),
            ilike(reviews.ownerReply, `%${query}%`),
          ),
        ]
      : []),
  ];

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
        fiveStarReviews: sql<number>`coalesce(count(*) filter (where ${reviews.rating} = 5), 0)::int`,
        hiddenReviews: sql<number>`coalesce(count(*) filter (where ${reviews.isPublished} = false), 0)::int`,
        needsReplyReviews: sql<number>`coalesce(count(*) filter (where ${reviews.ownerReply} is null or length(trim(${reviews.ownerReply})) = 0), 0)::int`,
        publishedReviews: sql<number>`coalesce(count(*) filter (where ${reviews.isPublished} = true), 0)::int`,
        repliedReviews: sql<number>`coalesce(count(*) filter (where ${reviews.ownerReply} is not null and length(trim(${reviews.ownerReply})) > 0), 0)::int`,
        totalReviews: count(),
      })
      .from(reviews)
      .where(and(...baseFilters)),
    db
      .select({
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        clientName: reviews.clientName,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        id: reviews.id,
        isPublished: reviews.isPublished,
        locationName: locations.name,
        ownerRepliedAt: reviews.ownerRepliedAt,
        ownerReply: reviews.ownerReply,
        ownerReplySource: reviews.ownerReplySource,
        rating: reviews.rating,
        reviewBookingId: reviews.bookingId,
        serviceName: services.name,
        staffName: staff.name,
        startsAt: bookings.startsAt,
      })
      .from(reviews)
      .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(staff, eq(bookings.staffId, staff.id))
      .leftJoin(locations, eq(bookings.locationId, locations.id))
      .where(and(...filters))
      .orderBy(desc(reviews.createdAt))
      .limit(limit),
  ]);
  const summary = summaryRows[0];

  return {
    filters: {
      limit,
      q: query,
      rating,
      status,
    },
    rows: rows.map((row) => ({
      booking: row.reviewBookingId
        ? {
            id: row.bookingId,
            locationName: row.locationName,
            serviceName: row.serviceName,
            staffName: row.staffName,
            startsAt: row.startsAt?.toISOString() ?? null,
            status: row.bookingStatus,
          }
        : null,
      clientName: row.clientName,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      id: row.id,
      isPublished: row.isPublished,
      ownerRepliedAt: row.ownerRepliedAt?.toISOString() ?? null,
      ownerReply: row.ownerReply,
      ownerReplySource: row.ownerReplySource,
      rating: row.rating,
    })),
    summary: summary ?? {
      averageRating: 0,
      fiveStarReviews: 0,
      hiddenReviews: 0,
      needsReplyReviews: 0,
      publishedReviews: 0,
      repliedReviews: 0,
      totalReviews: 0,
    },
  };
}

export async function getReviewDashboardDetail(businessId: string, reviewId: string) {
  const [detail] = await db
    .select({
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      clientName: reviews.clientName,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      id: reviews.id,
      isPublished: reviews.isPublished,
      locationName: locations.name,
      ownerRepliedAt: reviews.ownerRepliedAt,
      ownerReply: reviews.ownerReply,
      ownerReplySource: reviews.ownerReplySource,
      rating: reviews.rating,
      reviewBookingId: reviews.bookingId,
      serviceName: services.name,
      staffName: staff.name,
      startsAt: bookings.startsAt,
    })
    .from(reviews)
    .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(staff, eq(bookings.staffId, staff.id))
    .leftJoin(locations, eq(bookings.locationId, locations.id))
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, businessId)))
    .limit(1);

  if (!detail) return null;

  return {
    booking: detail.reviewBookingId
      ? {
          id: detail.bookingId,
          locationName: detail.locationName,
          serviceName: detail.serviceName,
          staffName: detail.staffName,
          startsAt: detail.startsAt?.toISOString() ?? null,
          status: detail.bookingStatus,
        }
      : null,
    review: {
      clientName: detail.clientName,
      comment: detail.comment,
      createdAt: detail.createdAt.toISOString(),
      id: detail.id,
      isPublished: detail.isPublished,
      ownerRepliedAt: detail.ownerRepliedAt?.toISOString() ?? null,
      ownerReply: detail.ownerReply,
      ownerReplySource: detail.ownerReplySource,
      rating: detail.rating,
    },
  };
}

export async function updateReviewDashboardFields(
  businessId: string,
  reviewId: string,
  patch: DashboardReviewUpdate,
) {
  const updates: {
    isPublished?: boolean;
    ownerReply?: string | null;
    ownerRepliedAt?: Date | null;
    ownerReplySource?: string | null;
  } = {};

  if (patch.isPublished !== undefined) {
    updates.isPublished = Boolean(patch.isPublished);
  }

  if (patch.ownerReply !== undefined) {
    const reply = patch.ownerReply?.trim() || null;
    updates.ownerReply = reply;
    updates.ownerRepliedAt = reply ? new Date() : null;
    updates.ownerReplySource = reply ? "manual" : null;
  }

  const [updated] = await db
    .update(reviews)
    .set(updates)
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, businessId)))
    .returning();

  return updated ?? null;
}
