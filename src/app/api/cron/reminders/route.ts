import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, businesses, locations, services, staff } from "@/db/schema";
import { eq, and, gte, lt, isNull } from "drizzle-orm";
import { sendBookingReminder } from "@/lib/resend";
import { addHours } from "date-fns";
import { parseLocationAiConfig } from "@/lib/locations";
import { canUseFeature, type Plan } from "@/lib/plan";

// Called by Vercel Cron every day at 10:00 AM Colombo time (04:30 UTC)
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = addHours(now, 20); // 20h from now
  const windowEnd = addHours(now, 28);   // 28h from now — catches anything in the next ~8h window around 24h

  // Find confirmed bookings starting in the 24h window that haven't had a reminder sent
  const upcoming = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      startsAt: bookings.startsAt,
      businessId: bookings.businessId,
      serviceId: bookings.serviceId,
      staffId: bookings.staffId,
      locationId: bookings.locationId,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        gte(bookings.startsAt, windowStart),
        lt(bookings.startsAt, windowEnd),
        isNull(bookings.reminderSentAt)
      )
    );

  let sent = 0;

  for (const booking of upcoming) {
    if (!booking.clientEmail) continue;

    const [business] = await db
      .select({ name: businesses.name, slug: businesses.slug, plan: businesses.plan })
      .from(businesses)
      .where(eq(businesses.id, booking.businessId))
      .limit(1);

    const [service] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);

    const [member] = await db
      .select({ name: staff.name })
      .from(staff)
      .where(eq(staff.id, booking.staffId))
      .limit(1);

    if (!business || !service || !member) continue;

    if (canUseFeature(business.plan as Plan, "smartReminderSystem") && booking.locationId) {
      const [location] = await db
        .select({ aiConfig: locations.aiConfig })
        .from(locations)
        .where(eq(locations.id, booking.locationId))
        .limit(1);
      if (parseLocationAiConfig(location?.aiConfig).smartReminderSystem) {
        continue;
      }
    }

    try {
      await sendBookingReminder({
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        businessName: business.name,
        businessSlug: business.slug,
        serviceName: service.name,
        staffName: member.name,
        startsAt: new Date(booking.startsAt),
        bookingId: booking.id,
      });

      await db
        .update(bookings)
        .set({ reminderSentAt: new Date() })
        .where(eq(bookings.id, booking.id));

      sent++;
    } catch (e) {
      console.error(`Reminder failed for booking ${booking.id}:`, e);
    }
  }

  return NextResponse.json({ sent, checked: upcoming.length });
}
