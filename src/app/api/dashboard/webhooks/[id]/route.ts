import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "@/lib/validation";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { requireApiBusiness } from "@/lib/api-auth";
import { isSafeWebhookDestination } from "@/lib/webhook-url";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  url: z.url().optional(),
  events: z.array(z.enum([
    "booking.created",
    "booking.confirmed",
    "booking.rescheduled",
    "booking.cancelled",
    "booking.completed",
    "booking.no_show",
  ])).min(1).optional(),
});

async function requireWebhooks(businessId: string) {
  try {
    await requirePro(businessId, "webhooks");
    return null;
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json(
        { error: "Webhooks require the Pro plan.", feature: "webhooks" },
        { status: 402 }
      );
    }
    throw error;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const planError = await requireWebhooks(businessId);
  if (planError) return planError;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook update." }, { status: 400 });
  }
  const body = parsed.data;
  if (body.url && !(await isSafeWebhookDestination(body.url))) {
    return NextResponse.json({ error: "Webhook URL must be a public HTTPS endpoint." }, { status: 400 });
  }
  const update: Record<string, unknown> = {};
  if ("isActive" in body) update.isActive = body.isActive;
  if ("url" in body) update.url = body.url;
  if ("events" in body) update.events = body.events;

  const [updated] = await db
    .update(webhooks)
    .set(update)
    .where(and(eq(webhooks.id, id), eq(webhooks.businessId, businessId)))
    .returning({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt,
      hasSecret: webhooks.secret,
    });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...updated, hasSecret: Boolean(updated.hasSecret) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const planError = await requireWebhooks(businessId);
  if (planError) return planError;
  const { id } = await params;

  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.businessId, businessId)));
  return NextResponse.json({ success: true });
}
