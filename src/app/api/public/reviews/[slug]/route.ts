import { NextResponse } from "next/server";
import { getPublicReviews } from "@/lib/reviews-public";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
  const offset = (page - 1) * limit;
  const ratingParam = searchParams.get("rating");
  const rating =
    ratingParam != null && ratingParam !== ""
      ? Math.min(Math.max(Number(ratingParam), 1), 5)
      : undefined;

  const data = await getPublicReviews(slug, { limit, offset, rating });

  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    businessName: data.businessName,
    avgRating: data.avgRating,
    reviewCount: data.reviewCount,
    page,
    hasMore: data.hasMore,
    reviews: data.reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  });
}
