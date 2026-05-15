import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;

  const list = await db
    .select()
    .from(reviews)
    .where(eq(reviews.businessId, businessId))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json(list);
}
