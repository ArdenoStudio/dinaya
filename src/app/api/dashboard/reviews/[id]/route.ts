import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "@/lib/validation";

interface Ctx { params: Promise<{ id: string }> }

const patchSchema = z.object({
  isPublished: z.boolean().optional(),
  ownerReply: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review update." }, { status: 400 });
  }

  const updates: {
    isPublished?: boolean;
    ownerReply?: string | null;
    ownerReplyAt?: Date | null;
    ownerReplySource?: string | null;
  } = {};

  if (parsed.data.isPublished !== undefined) {
    updates.isPublished = Boolean(parsed.data.isPublished);
  }

  if (parsed.data.ownerReply !== undefined) {
    const reply = parsed.data.ownerReply?.trim() || null;
    updates.ownerReply = reply;
    updates.ownerReplyAt = reply ? new Date() : null;
    updates.ownerReplySource = reply ? "manual" : null;
  }

  const [updated] = await db
    .update(reviews)
    .set(updates)
    .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  await db
    .delete(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)));

  return NextResponse.json({ success: true });
}
