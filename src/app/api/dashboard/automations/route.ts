import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { getAutomationsDashboardList } from "@/lib/dashboard/automations";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { z } from "@/lib/validation";

const ruleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  trigger: z.string().trim().min(1).max(80),
  delayMinutes: z.coerce.number().int().min(0).max(525600).default(0),
  conditions: z.unknown().optional().nullable(),
  actions: z.unknown(),
  isActive: z.boolean().optional(),
});

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

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireAutomations(businessId);
  if (accessError) return accessError;

  const rules = await getAutomationsDashboardList(businessId, { limit: 200 });

  return NextResponse.json(rules.rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireAutomations(businessId);
  if (accessError) return accessError;

  const parsed = ruleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the automation rule.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [rule] = await db
    .insert(automationRules)
    .values({
      businessId,
      name: parsed.data.name,
      trigger: parsed.data.trigger,
      delayMinutes: parsed.data.delayMinutes,
      conditions: parsed.data.conditions ?? null,
      actions: parsed.data.actions,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  return NextResponse.json(rule, { status: 201 });
}
