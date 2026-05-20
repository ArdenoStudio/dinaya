import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, staff, staffServices } from "@/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";
import { requireApiBusiness } from "@/lib/api-auth";
import { z } from "@/lib/validation";

const staffCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  bio: z.string().trim().max(1000).optional().nullable(),
  serviceIds: z.array(z.uuid()).optional().default([]),
});

export async function GET() {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const rows = await db
    .select({ id: staff.id, name: staff.name, bio: staff.bio, isActive: staff.isActive })
    .from(staff)
    .where(eq(staff.businessId, businessId));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = staffCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the staff details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, bio } = parsed.data;
  const serviceIds = Array.from(new Set(parsed.data.serviceIds));

  const [{ value: staffCount }] = await db
    .select({ value: count() })
    .from(staff)
    .where(eq(staff.businessId, businessId));
  try {
    await requirePlanLimit(businessId, "staff", Number(staffCount));
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json({ error: "Free businesses can add 1 staff member. Upgrade to Pro for more staff." }, { status: 402 });
    }
    throw error;
  }

  if (serviceIds.length > 0) {
    const validServices = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.businessId, businessId), inArray(services.id, serviceIds)));

    if (validServices.length !== serviceIds.length) {
      return NextResponse.json({ error: "One or more services are invalid." }, { status: 400 });
    }
  }

  const member = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(staff)
      .values({ businessId, name, bio: bio || null })
      .returning({ id: staff.id });

    if (serviceIds.length > 0) {
      await tx.insert(staffServices).values(
        serviceIds.map((serviceId) => ({ staffId: created.id, serviceId }))
      );
    }

    return created;
  });

  return NextResponse.json({ id: member.id }, { status: 201 });
}
