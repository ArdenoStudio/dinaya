import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { broadcasts } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  BROADCAST_AUDIENCE_TYPES,
  BROADCAST_CHANNELS,
  countMatchingRecipients,
  listBroadcastsForBusiness,
  sendBroadcast,
  serializeBroadcast,
  type BroadcastAudienceFilter,
} from "@/lib/broadcasts";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withApiHandler } from "@/lib/api-handler";
import { z } from "@/lib/validation";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  channel: z.enum(BROADCAST_CHANNELS),
  subject: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().min(1).max(4000),
  audienceType: z.enum(BROADCAST_AUDIENCE_TYPES),
  audienceFilter: z
    .union([
      z.object({ stage: z.enum(["lead", "prospect", "active", "churned"]) }),
      z.object({ tags: z.array(z.string().trim().min(1).max(40)).min(1).max(20) }),
    ])
    .optional()
    .nullable(),
  sendNow: z.boolean().default(true),
});

async function requireBroadcastAccess(businessId: string): Promise<NextResponse | null> {
  try {
    await requirePro(businessId, "broadcasts");
    return null;
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireBroadcastAccess(businessId);
  if (accessError) return accessError;

  const rows = await listBroadcastsForBusiness(businessId);
  return NextResponse.json(rows.map(serializeBroadcast));
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  return withApiHandler(async () => {
    const accessError = await requireBroadcastAccess(businessId);
    if (accessError) return accessError;

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the broadcast details.", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (parsed.data.audienceType === "stage" && !parsed.data.audienceFilter) {
      return NextResponse.json({ error: "Choose a client stage for this broadcast." }, { status: 400 });
    }

    if (parsed.data.audienceType === "tags" && !parsed.data.audienceFilter) {
      return NextResponse.json({ error: "Add at least one tag for this broadcast." }, { status: 400 });
    }

    const audienceFilter = (parsed.data.audienceFilter ?? null) as BroadcastAudienceFilter | null;
    const recipientPreview = await countMatchingRecipients(
      businessId,
      parsed.data.audienceType,
      audienceFilter,
    );

    if (recipientPreview === 0) {
      return NextResponse.json(
        { error: "No eligible clients match this audience. Clients who opted out are excluded." },
        { status: 400 },
      );
    }

    const now = new Date();
    const [created] = await db
      .insert(broadcasts)
      .values({
        businessId,
        name: parsed.data.name,
        channel: parsed.data.channel,
        subject: parsed.data.subject?.trim() || null,
        body: parsed.data.body,
        audienceType: parsed.data.audienceType,
        audienceFilter,
        status: parsed.data.sendNow ? "sending" : "draft",
        recipientCount: recipientPreview,
        updatedAt: now,
      })
      .returning();

    if (!parsed.data.sendNow) {
      return NextResponse.json({ broadcast: serializeBroadcast(created) }, { status: 201 });
    }

    try {
      const stats = await sendBroadcast(created);
      const finalStatus = stats.sentCount > 0 ? "sent" : stats.failedCount > 0 ? "failed" : "sent";

      const [updated] = await db
        .update(broadcasts)
        .set({
          status: finalStatus,
          recipientCount: stats.recipientCount,
          sentCount: stats.sentCount,
          skippedCount: stats.skippedCount,
          failedCount: stats.failedCount,
          sentAt: now,
          updatedAt: now,
        })
        .where(eq(broadcasts.id, created.id))
        .returning();

      return NextResponse.json({ broadcast: serializeBroadcast(updated) }, { status: 201 });
    } catch (error) {
      await db
        .update(broadcasts)
        .set({
          status: "failed",
          updatedAt: now,
        })
        .where(eq(broadcasts.id, created.id));

      throw error;
    }
  }, "Unable to send broadcast.");
}
