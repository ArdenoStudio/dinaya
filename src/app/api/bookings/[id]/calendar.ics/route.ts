import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, businesses, locations, services, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildBookingIcs } from "@/lib/calendar-ics";
import { withRateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const limited = await withRateLimit(req, {
    scope: "bookings",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { id: bookingId } = await context.params;
  const slug = req.nextUrl.searchParams.get("slug");

  const [booking] = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      clientName: bookings.clientName,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      serviceName: services.name,
      staffName: staff.name,
      locationName: locations.name,
      locationAddress: locations.address,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .leftJoin(locations, eq(locations.id, bookings.locationId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || (slug && booking.businessSlug !== slug)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const location = [booking.locationName, booking.locationAddress].filter(Boolean).join(", ");
  const ics = buildBookingIcs({
    uid: `${booking.id}@dinaya.lk`,
    title: `${booking.serviceName} · ${booking.businessName}`,
    description: `Booking for ${booking.clientName} with ${booking.staffName}`,
    location: location || undefined,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${booking.id.slice(0, 8)}.ics"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
