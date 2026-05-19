import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, reviews, bookings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface Ctx { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { bookingId, clientName, rating, comment } = await req.json();

  if (
    typeof clientName !== "string" ||
    clientName.trim().length === 0 ||
    clientName.length > 120
  ) {
    return NextResponse.json(
      { error: "Name is required and must be 120 characters or fewer." },
      { status: 400 },
    );
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a number between 1 and 5." },
      { status: 400 },
    );
  }

  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    return NextResponse.json({ error: "Comment must be a string." }, { status: 400 });
  }

  if (typeof comment === "string" && comment.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be 2000 characters or fewer." },
      { status: 400 },
    );
  }

  // If a bookingId is provided, verify it belongs to this business
  if (bookingId) {
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.businessId, business.id)))
      .limit(1);

    if (!booking) return NextResponse.json({ error: "Invalid booking." }, { status: 400 });

    // Prevent duplicate review for same booking
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .limit(1);

    if (existing) return NextResponse.json({ error: "You have already reviewed this booking." }, { status: 409 });
  }

  const [review] = await db
    .insert(reviews)
    .values({
      businessId: business.id,
      bookingId: bookingId ?? null,
      clientName: clientName.trim(),
      rating,
      comment: comment?.trim() || null,
      isPublished: true,
    })
    .returning();

  return NextResponse.json(review, { status: 201 });
}
