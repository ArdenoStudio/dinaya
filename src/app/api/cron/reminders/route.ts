import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookingNotifications, bookings, businesses, locations, services, staff } from "@/db/schema";
import { eq, and, gte, lt, isNull } from "drizzle-orm";
import { addHours } from "date-fns";
import { parseLocationAiConfig } from "@/lib/locations";
import { canUseFeature, type Plan } from "@/lib/plan";
import { sendBookingReminderMessage } from "@/lib/messaging/booking-messages";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import type { BookingLanguage } from "@/lib/i18n";

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
  const windowStart = addHours(now, 20);
  const windowEnd = addHours(now, 28);

  const upcoming = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      clientPhone: bookings.clientPhone,
      startsAt: bookings.startsAt,
      businessId: bookings.businessId,
      serviceId: bookings.serviceId,
      staffId: bookings.staffId,
      locationId: bookings.locationId,
      clientId: bookings.clientId,
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
  let skipped = 0;

  for (const booking of upcoming) {
    const [business] = await db
      .select({
        name: businesses.name,
        slug: businesses.slug,
        plan: businesses.plan,
        language: businesses.language,
      })
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
        skipped++;
        continue;
      }
    }

    const alreadySent = await db
      .select({ id: bookingNotifications.id })
      .from(bookingNotifications)
      .where(and(
        eq(bookingNotifications.bookingId, booking.id),
        eq(bookingNotifications.type, "reminder_24h"),
        eq(bookingNotifications.status, "sent"),
      ))
      .limit(1);

    if (alreadySent.length > 0) {
      await db
        .update(bookings)
        .set({ reminderSentAt: new Date() })
        .where(eq(bookings.id, booking.id));
      skipped++;
      continue;
    }

    try {
      const result = await sendBookingReminderMessage({
        businessId: booking.businessId,
        bookingId: booking.id,
        clientId: booking.clientId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        businessName: business.name,
        serviceName: service.name,
        staffName: member.name,
        startsAt: new Date(booking.startsAt),
        manageUrl: buildClientBookingUrl({
          bookingId: booking.id,
          clientPhone: booking.clientPhone,
        }),
        plan: business.plan as Plan,
        language: business.language as BookingLanguage,
      });

      if (result.status === "sent" || result.status === "duplicate") {
        await db
          .update(bookings)
          .set({ reminderSentAt: new Date() })
          .where(eq(bookings.id, booking.id));
        sent++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Reminder failed for booking ${booking.id}:`, error);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, checked: upcoming.length });
}
