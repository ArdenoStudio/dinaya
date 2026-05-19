import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { requirePro } from "@/lib/plan";
import { z } from "@/lib/validation";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = session.user.businessId;
  await requirePro(businessId, "automations");
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid automation update." }, { status: 400 });
  }

  const [updated] = await db
    .update(automationRules)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(automationRules.id, id), eq(automationRules.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = session.user.businessId;
  await requirePro(businessId, "automations");
  const { id } = await params;

  await db.delete(automationRules).where(and(eq(automationRules.id, id), eq(automationRules.businessId, businessId)));
  return NextResponse.json({ success: true });
}
