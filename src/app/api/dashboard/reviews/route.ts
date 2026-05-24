import { NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const list = await db
    .select()
    .from(reviews)
    .where(eq(reviews.businessId, businessId))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json(list);
}
