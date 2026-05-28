import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { availability, staff } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  availabilityWindowsUpdateSchema,
  updateAvailabilityDashboardWindows,
} from "@/lib/dashboard/availability";
import { withDashboardRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
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
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const rateLimit = await withDashboardRateLimit(req, businessId);
  if (!rateLimit.ok) return rateLimit.response;

  const parsed = availabilityWindowsUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid availability payload." }, { status: 400 });
  }

  const { staffId, rows } = parsed.data;

  const result = await updateAvailabilityDashboardWindows(businessId, staffId, rows);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
