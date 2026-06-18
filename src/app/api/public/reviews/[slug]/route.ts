import { NextRequest, NextResponse } from "next/server";
import { getPublicReviews } from "@/lib/reviews-public";
import { withRateLimit } from "@/lib/rate-limit";
import { parsePublicReviewsQuery } from "@/lib/reviews-query";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const limited = await withRateLimit(req, {
    scope: "public-reviews",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { slug } = await params;
  const query = parsePublicReviewsQuery(req.nextUrl.searchParams);
  if (!query) {
    return NextResponse.json(
      { error: "Invalid pagination request." },
      { status: 400 },
    );
  }

  const data = await getPublicReviews(slug, query);

  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    businessName: data.businessName,
    avgRating: data.avgRating,
    reviewCount: data.reviewCount,
    page: query.page,
    hasMore: data.hasMore,
    reviews: data.reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  });
}
