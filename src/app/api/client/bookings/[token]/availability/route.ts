import { NextRequest, NextResponse } from "next/server";
import { verifyClientBookingToken } from "@/lib/client-tokens";
import { getRescheduleSlots } from "@/lib/booking-reschedule";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const limited = await withRateLimit(req, {
    scope: "client-availability",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { token } = await params;
  const payload = verifyClientBookingToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  const result = await getRescheduleSlots({
    bookingId: payload.bookingId,
    date,
  });

  if (!result) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (result.blockedReason) {
    return NextResponse.json({ slots: [], blockedReason: result.blockedReason });
  }

  return NextResponse.json({
    slots: result.slots.map((slot) => ({
      startUtc: slot.startUtc.toISOString(),
      endUtc: slot.endUtc.toISOString(),
      label: slot.label,
    })),
  });
}
