import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { bookings, payments, services, staff } from "@/db/schema";
import { eq, and, desc, lt, gte, ne, ilike, or } from "drizzle-orm";

const COLS = {
  id: bookings.id,
  clientId: bookings.clientId,
  clientEmail: bookings.clientEmail,
  clientName: bookings.clientName,
  clientPhone: bookings.clientPhone,
  endsAt: bookings.endsAt,
  amountLkr: payments.amountLkr,
  paymentStatus: payments.status,
  source: bookings.source,
  startsAt: bookings.startsAt,
  status: bookings.status,
  serviceName: services.name,
  staffName: staff.name,
};

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;

function csvEscape(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({
    req,
    apiKeyScope: "bookings:read",
  });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const params = new URL(req.url).searchParams;
  const tab = params.get("tab") ?? "upcoming";
  const status = params.get("status");
  const staffId = params.get("staffId");
  const serviceId = params.get("serviceId");
  const from = params.get("from");
  const to = params.get("to");
  const query = params.get("q")?.trim();
  const exportFormat = params.get("export");
  const now = new Date();

  const filters = [
    eq(bookings.businessId, businessId),
    ...(tab === "upcoming"  ? [gte(bookings.startsAt, now), ne(bookings.status, "cancelled")] : []),
    ...(tab === "past"      ? [lt(bookings.startsAt, now),  ne(bookings.status, "cancelled")] : []),
    ...(tab === "cancelled" ? [eq(bookings.status, "cancelled")]                              : []),
    ...(status && BOOKING_STATUSES.includes(status as typeof BOOKING_STATUSES[number])
      ? [eq(bookings.status, status as typeof BOOKING_STATUSES[number])]
      : []),
    ...(staffId ? [eq(bookings.staffId, staffId)] : []),
    ...(serviceId ? [eq(bookings.serviceId, serviceId)] : []),
    ...(from ? [gte(bookings.startsAt, new Date(from))] : []),
    ...(to ? [lt(bookings.startsAt, new Date(to))] : []),
    ...(query
      ? [
          or(
            ilike(bookings.clientName, `%${query}%`),
            ilike(bookings.clientPhone, `%${query}%`),
            ilike(bookings.clientEmail, `%${query}%`)
          ),
        ]
      : []),
  ];

  const base = and(...filters);

  const order = tab === "upcoming" ? bookings.startsAt : desc(bookings.startsAt);

  const rows = await db
    .select(COLS)
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .where(base)
    .orderBy(order)
    .limit(exportFormat === "csv" ? 50000 : 100);

  if (exportFormat === "csv") {
    const header = ["date", "client", "phone", "email", "service", "staff", "status", "amount_lkr", "payment_status", "source"];
    const body = rows.map((row) => [
      row.startsAt,
      row.clientName,
      row.clientPhone,
      row.clientEmail,
      row.serviceName,
      row.staffName,
      row.status,
      row.amountLkr,
      row.paymentStatus,
      row.source,
    ].map(csvEscape).join(","));

    return new NextResponse([header.join(","), ...body].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dinaya-bookings.csv"`,
      },
    });
  }

  return NextResponse.json(rows);
}
