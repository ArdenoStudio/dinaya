import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withApiHandler } from "@/lib/api-handler";
import { z } from "@/lib/validation";

const replySchema = z.object({
  ownerReply: z.string().trim().max(2000).nullable(),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  return withApiHandler(async () => {
    try {
      await requirePro(businessId, "reviewReplies");
    } catch (error) {
      if (error instanceof PlanRequiredError) {
        return NextResponse.json({ error: error.message }, { status: 402 });
      }
      throw error;
    }

    const body = await req.json();
    if ("isPublished" in body) {
      const [updated] = await db
        .update(reviews)
        .set({ isPublished: Boolean(body.isPublished) })
        .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)))
        .returning();
      if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json(updated);
    }

    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your reply." }, { status: 400 });
    }

    const [updated] = await db
      .update(reviews)
      .set({
        ownerReply: parsed.data.ownerReply,
        ownerRepliedAt: parsed.data.ownerReply ? new Date() : null,
      })
      .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(updated);
  }, "Unable to update review.");
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  await db.delete(reviews).where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)));
  return NextResponse.json({ success: true });
}
