import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { staff, staffServices } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const rows = await db
    .select({ id: staff.id, name: staff.name, bio: staff.bio, isActive: staff.isActive })
    .from(staff)
    .where(eq(staff.businessId, businessId));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const { name, bio, serviceIds } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

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

  const [member] = await db
    .insert(staff)
    .values({ businessId, name, bio: bio || null })
    .returning({ id: staff.id });

  if (serviceIds?.length) {
    await db.insert(staffServices).values(
      serviceIds.map((serviceId: string) => ({ staffId: member.id, serviceId }))
    );
  }

  return NextResponse.json({ id: member.id }, { status: 201 });
}
