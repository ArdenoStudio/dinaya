import { NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { businesses, reviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateAiCopy } from "@/lib/ai/copy";
import { PlanRequiredError, requirePro } from "@/lib/plan";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Ctx) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  try {
    await requirePro(businessId, "reviewReplies");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: "AI review replies are available on Pro." }, { status: 402 });
    }
    throw error;
  }

  const [review] = await db
    .select({
      clientName: reviews.clientName,
      rating: reviews.rating,
      comment: reviews.comment,
    })
    .from(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.businessId, businessId)))
    .limit(1);

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [business] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const generated = await generateAiCopy({
    feature: "reviewReplies",
    businessName: business?.name ?? "Our business",
    clientName: review.clientName,
    extra: `Rating: ${review.rating}/5. Review: ${review.comment ?? "No written comment."}`,
  });

  return NextResponse.json({
    reply: generated.body,
    source: generated.source,
  });
}
