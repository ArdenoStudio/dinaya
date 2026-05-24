import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { getRescheduleSlots } from "@/lib/booking-reschedule";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;

  const { id } = await params;
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  const [owned] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.businessId, authResult.context.businessId)))
    .limit(1);

  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const result = await getRescheduleSlots({ bookingId: id, date });
  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    slots: result.slots.map((slot) => ({
      startUtc: slot.startUtc.toISOString(),
      endUtc: slot.endUtc.toISOString(),
      label: slot.label,
    })),
    blockedReason: result.blockedReason,
  });
}
