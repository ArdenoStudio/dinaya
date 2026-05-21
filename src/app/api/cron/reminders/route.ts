import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, businesses, services, staff } from "@/db/schema";
import { eq, and, gte, lt, isNull, inArray } from "drizzle-orm";
import { sendBookingReminder } from "@/lib/resend";
import { addHours } from "date-fns";
import { canUseFeature, type Plan } from "@/lib/plan";

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
      startsAt: bookings.startsAt,
      businessId: bookings.businessId,
      serviceId: bookings.serviceId,
      staffId: bookings.staffId,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        gte(bookings.startsAt, windowStart),
        lt(bookings.startsAt, windowEnd),
        isNull(bookings.reminderSentAt),
      ),
    );

  if (upcoming.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0 });
  }

  const businessIds = [...new Set(upcoming.map((b) => b.businessId))];
  const serviceIds = [...new Set(upcoming.map((b) => b.serviceId))];
  const staffIds = [...new Set(upcoming.map((b) => b.staffId))];

  const [businessRows, serviceRows, staffRows] = await Promise.all([
    db
      .select({ id: businesses.id, name: businesses.name, slug: businesses.slug, plan: businesses.plan })
      .from(businesses)
      .where(inArray(businesses.id, businessIds)),
    db.select({ id: services.id, name: services.name }).from(services).where(inArray(services.id, serviceIds)),
    db.select({ id: staff.id, name: staff.name }).from(staff).where(inArray(staff.id, staffIds)),
  ]);

  const businessMap = new Map(businessRows.map((row) => [row.id, row]));
  const serviceMap = new Map(serviceRows.map((row) => [row.id, row]));
  const staffMap = new Map(staffRows.map((row) => [row.id, row]));

  let sent = 0;
  const sentIds: string[] = [];

  for (const booking of upcoming) {
    if (!booking.clientEmail) continue;
    const business = businessMap.get(booking.businessId);
    const service = serviceMap.get(booking.serviceId);
    const member = staffMap.get(booking.staffId);
    if (!business || !service || !member) continue;
    if (!canUseFeature(business.plan as Plan, "smartReminderSystem")) continue;

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
      sentIds.push(booking.id);
      sent++;
    } catch (error) {
      console.error(`Reminder failed for booking ${booking.id}:`, error);
    }
  }

  if (sentIds.length > 0) {
    await db
      .update(bookings)
      .set({ reminderSentAt: new Date() })
      .where(inArray(bookings.id, sentIds));
  }

  return NextResponse.json({ sent, checked: upcoming.length });
}
