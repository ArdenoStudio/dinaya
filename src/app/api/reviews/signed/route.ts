import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, reviews } from "@/db/schema";
import { verifyReviewToken } from "@/lib/ai/review-links";
import { z } from "@/lib/validation";

const reviewSchema = z.object({
  token: z.string().min(20),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
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

  const [review] = await db
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

  return NextResponse.json({ review }, { status: 201 });
}
