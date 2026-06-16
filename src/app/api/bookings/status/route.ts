import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, payments } from "@/db/schema";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  bookingId: z.uuid(),
  slug: z.string().trim().min(1).max(80),
});

export async function GET(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "booking-payment-status",
    limit: 30,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const parsed = querySchema.safeParse({
    bookingId: req.nextUrl.searchParams.get("bookingId"),
    slug: req.nextUrl.searchParams.get("slug"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking status request." }, { status: 400 });
  }

  const [row] = await db
    .select({
      bookingStatus: bookings.status,
      paymentStatus: payments.status,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(businesses.slug, parsed.data.slug)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({
    bookingStatus: row.bookingStatus,
    paymentStatus: row.paymentStatus ?? null,
    confirmed: row.bookingStatus === "confirmed" || row.bookingStatus === "completed",
    pending: row.bookingStatus === "pending",
    serverTime: new Date().toISOString(),
  });
}
