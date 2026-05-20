import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { z } from "@/lib/validation";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { requireApiBusiness } from "@/lib/api-auth";
import { isSafeWebhookUrl } from "@/lib/webhook-url";

const EVENTS = [
  "booking.created",
  "booking.confirmed",
  "booking.rescheduled",
  "booking.cancelled",
  "booking.completed",
  "booking.no_show",
] as const;

const webhookSchema = z.object({
  url: z.url(),
  events: z.array(z.enum(EVENTS)).min(1),
  secret: z.string().trim().min(16).max(200).optional(),
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

export async function GET() {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const planError = await requireWebhooks(businessId);
  if (planError) return planError;

  const list = await db
    .select({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt,
      hasSecret: webhooks.secret,
    })
    .from(webhooks)
    .where(eq(webhooks.businessId, businessId));
  return NextResponse.json(list.map((hook) => ({ ...hook, hasSecret: Boolean(hook.hasSecret) })));
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const planError = await requireWebhooks(businessId);
  if (planError) return planError;

  const parsed = webhookSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the webhook details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { url, events, secret: providedSecret } = parsed.data;
  if (!isSafeWebhookUrl(url)) {
    return NextResponse.json({ error: "Webhook URL must be a public HTTPS endpoint." }, { status: 400 });
  }

  const secret = providedSecret || crypto.randomBytes(24).toString("hex");

  const [hook] = await db
    .insert(webhooks)
    .values({ businessId, url, events, secret })
    .returning({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt,
    });

  return NextResponse.json({ ...hook, hasSecret: true, secret }, { status: 201 });
}
