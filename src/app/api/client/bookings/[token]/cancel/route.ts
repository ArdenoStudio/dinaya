import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses } from "@/db/schema";
import { canClientCancelBooking, getClientBookingByToken } from "@/lib/client-booking";
import { sendBookingCancellationMessage } from "@/lib/messaging/booking-messages";
import { dispatchWebhooks } from "@/lib/webhooks";
import { logActivity } from "@/lib/activity-log";
import type { Plan } from "@/lib/plan";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const cancelSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const limited = await withRateLimit(req, {
    scope: "client-cancel",
    limit: 10,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { token } = await params;
  const booking = await getClientBookingByToken(token);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const parsed = cancelSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const cancelCheck = canClientCancelBooking({
    startsAt: booking.startsAt,
    status: booking.status,
    minimumNoticeHours: booking.minimumNoticeHours,
  });

  if (!cancelCheck.allowed) {
    return NextResponse.json({ error: cancelCheck.reason ?? "Cannot cancel this booking." }, { status: 400 });
  }

  await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: parsed.data.reason ?? "Cancelled by client",
    })
    .where(eq(bookings.id, booking.id));

  const [business] = await db
    .select({ plan: businesses.plan })
    .from(businesses)
    .where(eq(businesses.id, booking.businessId))
    .limit(1);

  void logActivity({
    action: "cancelled",
    businessId: booking.businessId,
    entity: "booking",
    entityId: booking.id,
    meta: { source: "client_portal" },
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });

  void dispatchWebhooks(booking.businessId, "booking.cancelled", {
    bookingId: booking.id,
    status: "cancelled",
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    serviceName: booking.serviceName,
    startsAt: booking.startsAt.toISOString(),
  });

  await sendBookingCancellationMessage({
    businessId: booking.businessId,
    bookingId: booking.id,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientPhone: booking.clientPhone,
    businessName: booking.businessName,
    serviceName: booking.serviceName,
    startsAt: booking.startsAt,
    plan: (business?.plan ?? "free") as Plan,
  });

  return NextResponse.json({ ok: true });
}
