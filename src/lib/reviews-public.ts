import { db } from "@/db";
import { businesses, reviews } from "@/db/schema";
import { and, avg, count, desc, eq } from "drizzle-orm";

export type ReviewDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type PublicReview = {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
  ownerReply: string | null;
  createdAt: Date;
};

export function emptyReviewDistribution(): ReviewDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export async function getReviewDistribution(businessId: string): Promise<ReviewDistribution> {
  const rows = await db
    .select({ rating: reviews.rating, count: count() })
    .from(reviews)
    .where(and(eq(reviews.businessId, businessId), eq(reviews.isPublished, true)))
    .groupBy(reviews.rating);

  const distribution = emptyReviewDistribution();
  for (const row of rows) {
    if (row.rating >= 1 && row.rating <= 5) {
      distribution[row.rating as keyof ReviewDistribution] = Number(row.count);
    }
  }
  return distribution;
}

export async function getPublicReviews(
  slug: string,
  options: { limit?: number; offset?: number; rating?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const offset = Math.max(options.offset ?? 0, 0);
  const ratingFilter =
    options.rating != null && options.rating >= 1 && options.rating <= 5
      ? options.rating
      : undefined;

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) return null;

  const reviewWhere = and(
    eq(reviews.businessId, business.id),
    eq(reviews.isPublished, true),
    ratingFilter != null ? eq(reviews.rating, ratingFilter) : undefined,
  );

  const [reviewList, ratingData] = await Promise.all([
    db
      .select({
        id: reviews.id,
        clientName: reviews.clientName,
        rating: reviews.rating,
        comment: reviews.comment,
        ownerReply: reviews.ownerReply,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(reviewWhere)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ avg: avg(reviews.rating), count: count() })
      .from(reviews)
      .where(
        and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true)),
      ),
  ]);

  return {
    businessName: business.name,
    avgRating: ratingData[0]?.avg ? parseFloat(String(ratingData[0].avg)) : null,
    reviewCount: Number(ratingData[0]?.count ?? 0),
    reviews: reviewList,
    hasMore: reviewList.length === limit,
  };
}
