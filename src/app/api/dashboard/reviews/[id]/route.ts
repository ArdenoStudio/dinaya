import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;
  const { isPublished } = await req.json();

  const [updated] = await db
    .update(reviews)
    .set({ isPublished: Boolean(isPublished) })
    .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  await db
    .delete(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)));

  return NextResponse.json({ success: true });
}
