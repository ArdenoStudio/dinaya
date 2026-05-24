import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { publishContentItem } from "@/lib/ai/content";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "aiContentMachine");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const { id } = await params;
  try {
    const item = await publishContentItem(businessId, id);
    if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish content." },
      { status: 400 }
    );
  }
}
