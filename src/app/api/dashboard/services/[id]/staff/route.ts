import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { staff, staffServices, services } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id: serviceId } = await params;

  // Verify service belongs to business
  const [svc] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .limit(1);

  if (!svc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const rows = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .innerJoin(staffServices, eq(staffServices.staffId, staff.id))
    .where(and(eq(staffServices.serviceId, serviceId), eq(staff.isActive, true)));

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id: serviceId } = await params;

  // Verify service belongs to business
  const [svc] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .limit(1);

  if (!svc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const { staffIds } = body as { staffIds: string[] };

  // Replace all assignments for this service (upsert pattern)
  await db.delete(staffServices).where(eq(staffServices.serviceId, serviceId));

  if (Array.isArray(staffIds) && staffIds.length > 0) {
    await db.insert(staffServices).values(
      staffIds.map((staffId) => ({ staffId, serviceId }))
    );
  }

  return NextResponse.json({ success: true });
}
