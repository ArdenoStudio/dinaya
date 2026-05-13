import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, services, staff } from "@/db/schema";
import { eq, and, desc, lt, gte, ne } from "drizzle-orm";

const COLS = {
  id: bookings.id,
  clientId: bookings.clientId,
  clientName: bookings.clientName,
  clientPhone: bookings.clientPhone,
  startsAt: bookings.startsAt,
  status: bookings.status,
  serviceName: services.name,
  staffName: staff.name,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const tab = new URL(req.url).searchParams.get("tab") ?? "upcoming";
  const now = new Date();

  const base = and(
    eq(bookings.businessId, businessId),
    ...(tab === "upcoming"  ? [gte(bookings.startsAt, now), ne(bookings.status, "cancelled")] : []),
    ...(tab === "past"      ? [lt(bookings.startsAt, now),  ne(bookings.status, "cancelled")] : []),
    ...(tab === "cancelled" ? [eq(bookings.status, "cancelled")]                              : []),
  );

  const order = tab === "upcoming" ? bookings.startsAt : desc(bookings.startsAt);

  const rows = await db
    .select(COLS)
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .where(base)
    .orderBy(order)
    .limit(100);

  return NextResponse.json(rows);
}
