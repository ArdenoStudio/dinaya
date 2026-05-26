import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte, inArray, lt } from "drizzle-orm";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { db } from "@/db";
import { bookings, businesses, services } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";

const DEFAULT_TIMEZONE = "Asia/Colombo";
const DEFAULT_WINDOW_MINUTES = 180;
const MIN_WINDOW_MINUTES = 15;
const MAX_WINDOW_MINUTES = 720;
const TRACKED_STATUSES = ["pending", "confirmed"] as const;

function parseWindowMinutes(raw: string | null): number {
  if (!raw) return DEFAULT_WINDOW_MINUTES;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return NaN;
  const rounded = Math.round(parsed);
  return Math.min(MAX_WINDOW_MINUTES, Math.max(MIN_WINDOW_MINUTES, rounded));
}

function parseSince(raw: string | null): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const searchParams = req.nextUrl.searchParams;
  const windowMinutes = parseWindowMinutes(searchParams.get("windowMinutes"));
  if (!Number.isFinite(windowMinutes)) {
    return NextResponse.json({ error: "windowMinutes must be a valid number." }, { status: 400 });
  }

  const rawSince = searchParams.get("since");
  const since = parseSince(rawSince);
  if (rawSince && !since) {
    return NextResponse.json({ error: "since must be a valid ISO date." }, { status: 400 });
  }

  const [business] = await db
    .select({ timezone: businesses.timezone })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const timezone = business?.timezone ?? DEFAULT_TIMEZONE;
  const now = new Date();
  const localNow = toZonedTime(now, timezone);
  const todayStart = fromZonedTime(startOfDay(localNow), timezone);
  const todayEnd = fromZonedTime(endOfDay(localNow), timezone);
  const windowEnd = addMinutes(now, windowMinutes);

  const [{ todayBookings }] = await db
    .select({ todayBookings: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.businessId, businessId),
        inArray(bookings.status, TRACKED_STATUSES),
        gte(bookings.startsAt, todayStart),
        lt(bookings.startsAt, todayEnd),
      ),
    );

  const upcomingFilters = [
    eq(bookings.businessId, businessId),
    inArray(bookings.status, TRACKED_STATUSES),
    gte(bookings.startsAt, now),
    lt(bookings.startsAt, windowEnd),
    ...(since ? [gte(bookings.createdAt, since)] : []),
  ];

  const upcomingRows = await db
    .select({
      clientName: bookings.clientName,
      id: bookings.id,
      serviceName: services.name,
      startsAt: bookings.startsAt,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(...upcomingFilters))
    .orderBy(bookings.startsAt)
    .limit(200);

  return NextResponse.json({
    serverTime: now.toISOString(),
    todayBookings: Number(todayBookings ?? 0),
    upcoming: upcomingRows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      serviceName: row.serviceName,
      startsAt: row.startsAt.toISOString(),
      status: row.status,
    })),
  });
}
