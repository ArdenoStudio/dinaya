import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { z } from "@/lib/validation";

async function requireAutomations(businessId: string): Promise<NextResponse | null> {
  try {
    await requirePro(businessId, "automations");
    return null;
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json(
        { error: error.message, feature: "automations" },
        { status: 402 },
      );
    }
    throw error;
  }
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireAutomations(businessId);
  if (accessError) return accessError;
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

export async function DELETE(req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireAutomations(businessId);
  if (accessError) return accessError;
  const { id } = await params;

  await db.delete(automationRules).where(and(eq(automationRules.id, id), eq(automationRules.businessId, businessId)));
  return NextResponse.json({ success: true });
}
