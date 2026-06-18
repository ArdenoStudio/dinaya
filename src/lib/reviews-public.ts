import { db } from "@/db";
import { businesses, reviews } from "@/db/schema";
import { and, avg, count, desc, eq } from "drizzle-orm";

export type PublicReview = {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
  ownerReply: string | null;
  createdAt: Date;
};

export async function getPublicReviews(
  slug: string,
  options: { limit?: number; offset?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const offset = Math.max(options.offset ?? 0, 0);

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) return null;

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
      .where(and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ avg: avg(reviews.rating), count: count() })
      .from(reviews)
      .where(and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true))),
  ]);

  const reviewCount = Number(ratingData[0]?.count ?? 0);

  return {
    businessName: business.name,
    avgRating: ratingData[0]?.avg ? parseFloat(String(ratingData[0].avg)) : null,
    reviewCount,
    reviews: reviewList,
    hasMore: offset + reviewList.length < reviewCount,
  };
}
