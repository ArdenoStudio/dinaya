import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, reviews } from "@/db/schema";
import { verifyReviewToken } from "@/lib/ai/review-links";
import { withRateLimit } from "@/lib/rate-limit";
import { withApiHandler } from "@/lib/api-handler";
import { z } from "@/lib/validation";

const reviewSchema = z.object({
  token: z.string().min(20),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable(),
});

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const limited = await withRateLimit(req, {
    scope: "reviews",
    limit: 10,
    windowSeconds: 60 * 15,
  });
  if (!limited.ok) return limited.response;

  return withApiHandler(async () => {
    const { slug } = await params;

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parsed = reviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your review." }, { status: 400 });
    }

    const token = verifyReviewToken(parsed.data.token);
    if (!token || token.businessSlug !== slug) {
      return NextResponse.json({ error: "This review link is invalid or expired." }, { status: 400 });
    }

    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.id, token.bookingId), eq(bookings.businessId, business.id)))
      .limit(1);

    if (!booking) return NextResponse.json({ error: "Invalid booking." }, { status: 400 });

    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.bookingId, token.bookingId))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this booking." }, { status: 409 });
    }

    const [review] = await db
      .insert(reviews)
      .values({
        businessId: business.id,
        bookingId: token.bookingId,
        clientName: token.clientName.trim(),
        rating: parsed.data.rating,
        comment: parsed.data.comment?.trim() || null,
        isPublished: true,
      })
      .returning();

    return NextResponse.json(review, { status: 201 });
  }, "Unable to submit review.");
}
