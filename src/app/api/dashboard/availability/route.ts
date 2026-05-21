import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { availability, staff } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type AvailabilityInput = { dayOfWeek: number; startTime: string; endTime: string };

function validateAvailabilityRows(rows: AvailabilityInput[]): string | null {
  for (const row of rows) {
    if (row.dayOfWeek < 0 || row.dayOfWeek > 6 || row.startTime >= row.endTime) {
      return "Availability contains an invalid day or time range.";
    }
  }

  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const dayRows = rows
      .filter((row) => row.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < dayRows.length; i++) {
      if (dayRows[i - 1].endTime > dayRows[i].startTime) {
        return "Availability blocks cannot overlap.";
      }
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const staffId = req.nextUrl.searchParams.get("staffId");
  if (!staffId) return NextResponse.json({ error: "staffId required" }, { status: 400 });

  // Verify staff belongs to this business
  const [member] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db.select().from(availability).where(eq(availability.staffId, staffId));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { staffId, rows } = await req.json() as { staffId?: string; rows?: AvailabilityInput[] };

  if (!staffId) return NextResponse.json({ error: "staffId required" }, { status: 400 });

  // Verify ownership
  const [member] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const safeRows = Array.isArray(rows) ? rows : [];
  const validationError = validateAvailabilityRows(safeRows);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Replace all rows for this staff member
  await db.delete(availability).where(eq(availability.staffId, staffId));

  if (safeRows.length) {
    await db.insert(availability).values(
      safeRows.map((r) => ({
        staffId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
