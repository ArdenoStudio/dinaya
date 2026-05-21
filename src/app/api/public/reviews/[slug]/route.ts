import { NextResponse } from "next/server";
import { getPublicReviews } from "@/lib/reviews-public";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const data = await getPublicReviews(slug);

  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    businessName: data.businessName,
    avgRating: data.avgRating,
    reviewCount: data.reviewCount,
    reviews: data.reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  });
}
