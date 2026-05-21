import { NextRequest, NextResponse } from "next/server";
import { verifyClientBookingToken } from "@/lib/client-tokens";
import { rescheduleBooking } from "@/lib/booking-reschedule";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const rescheduleSchema = z.object({
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const limited = await withRateLimit(req, {
    scope: "client-reschedule",
    limit: 10,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { token } = await params;
  const payload = verifyClientBookingToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const parsed = rescheduleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please choose a valid time slot.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await rescheduleBooking({
    bookingId: payload.bookingId,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
    source: "client_portal",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    booking: {
      id: result.booking.id,
      startsAt: result.booking.startsAt.toISOString(),
      endsAt: result.booking.endsAt.toISOString(),
      status: result.booking.status,
    },
  });
}
