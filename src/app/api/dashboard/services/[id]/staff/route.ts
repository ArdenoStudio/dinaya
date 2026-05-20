import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, staffServices, services } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { z } from "@/lib/validation";

const assignmentSchema = z.object({
  staffIds: z.array(z.uuid()).default([]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
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
    .where(
      and(
        eq(staffServices.serviceId, serviceId),
        eq(staff.businessId, businessId),
        eq(staff.isActive, true)
      )
    );

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id: serviceId } = await params;

  // Verify service belongs to business
  const [svc] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .limit(1);

  if (!svc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = assignmentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the staff assignments.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const staffIds = Array.from(new Set(parsed.data.staffIds));
  if (staffIds.length > 0) {
    const validStaff = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), inArray(staff.id, staffIds)));

    if (validStaff.length !== staffIds.length) {
      return NextResponse.json({ error: "One or more staff members are invalid." }, { status: 400 });
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(staffServices).where(eq(staffServices.serviceId, serviceId));

    if (staffIds.length > 0) {
      await tx.insert(staffServices).values(
        staffIds.map((staffId) => ({ staffId, serviceId }))
      );
    }
  });

  return NextResponse.json({ success: true });
}
