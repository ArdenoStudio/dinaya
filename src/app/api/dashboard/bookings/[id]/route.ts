import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
type BookingStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status as BookingStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: status as BookingStatus })
    .where(and(eq(bookings.id, id), eq(bookings.businessId, businessId)))
    .returning({ id: bookings.id, status: bookings.status });

  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(updated);
}
