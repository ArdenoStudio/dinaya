import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses } from "@/db/schema";
import { getClientBookingByToken } from "@/lib/client-booking";
import { canModifyClientBooking } from "@/lib/booking-reschedule";
import { sendBookingCancellationMessage } from "@/lib/messaging/booking-messages";
import { processBookingAutomationTrigger } from "@/lib/automations/engine";
import { dispatchWebhooks } from "@/lib/webhooks";
import { logActivity } from "@/lib/activity-log";
import { releaseDealSlotForBooking } from "@/lib/deals/claim";
import { resolveEffectivePlan } from "@/lib/plan";
import { withRateLimit } from "@/lib/rate-limit";
import { runAfterResponse } from "@/lib/after-response";
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

  const cancelCheck = canModifyClientBooking({
    startsAt: booking.startsAt,
    status: booking.status,
    minimumNoticeHours: booking.minimumNoticeHours,
    action: "cancel",
  });

  if (!cancelCheck.allowed) {
    return NextResponse.json({ error: cancelCheck.reason ?? "Cannot cancel this booking." }, { status: 400 });
  }

  const priorStatus = booking.status;

  const [cancelled] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: parsed.data.reason ?? "Cancelled by client",
    })
    .where(and(
      eq(bookings.id, booking.id),
      inArray(bookings.status, ["pending", "confirmed"]),
    ))
    .returning({ id: bookings.id });

  if (!cancelled) {
    return NextResponse.json({ error: "This booking is already cancelled." }, { status: 409 });
  }

  void releaseDealSlotForBooking(booking.id, priorStatus).catch((error) => {
    console.error("Deal slot release failed:", error);
  });

  const [business] = await db
    .select({ plan: businesses.plan, planExpiresAt: businesses.planExpiresAt })
    .from(businesses)
    .where(eq(businesses.id, booking.businessId))
    .limit(1);
  const effectivePlan = resolveEffectivePlan({
    storedPlan: business?.plan,
    planExpiresAt: business?.planExpiresAt,
  });

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

  runAfterResponse("booking cancellation message", async () => {
    await sendBookingCancellationMessage({
      businessId: booking.businessId,
      bookingId: booking.id,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      businessName: booking.businessName,
      serviceName: booking.serviceName,
      startsAt: booking.startsAt,
      plan: effectivePlan,
    });
  });

  void processBookingAutomationTrigger(booking.businessId, booking.id, "booking.cancelled").catch((error) => {
    console.error("Automation trigger failed:", error);
  });

  return NextResponse.json({ ok: true });
}
