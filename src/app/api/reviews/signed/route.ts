import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, reviews } from "@/db/schema";
import { verifyReviewToken } from "@/lib/ai/review-links";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const reviewSchema = z.object({
  token: z.string().min(20),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable(),
});

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; cause?: { code?: string } };
  return maybe.code === "23505" || maybe.cause?.code === "23505";
}

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "review-submit",
    limit: 10,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const parsed = reviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your review." }, { status: 400 });
  }

  const token = verifyReviewToken(parsed.data.token);
  if (!token) return NextResponse.json({ error: "This review link is invalid or expired." }, { status: 400 });

  const [booking] = await db
    .select({
      id: bookings.id,
      businessId: bookings.businessId,
      clientName: bookings.clientName,
      slug: businesses.slug,
    })
    .from(bookings)
    .innerJoin(businesses, eq(bookings.businessId, businesses.id))
    .where(and(eq(bookings.id, token.bookingId), eq(businesses.slug, token.businessSlug)))
    .limit(1);

  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, booking.id))
    .limit(1);
  if (existing) return NextResponse.json({ error: "This booking already has a review." }, { status: 409 });

  let review;
  try {
    [review] = await db
      .insert(reviews)
      .values({
        businessId: booking.businessId,
        bookingId: booking.id,
        clientName: token.clientName || booking.clientName,
        rating: parsed.data.rating,
        comment: parsed.data.comment?.trim() || null,
        isPublished: true,
      })
      .returning();
  } catch (error) {
    // Two submissions can race past the existence check above; the
    // reviews_booking_id_unique index makes the loser fail. Return a clean 409
    // instead of a 500.
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "This booking already has a review." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ review }, { status: 201 });
}
