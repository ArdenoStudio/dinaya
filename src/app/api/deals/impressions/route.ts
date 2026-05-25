import { NextRequest, NextResponse } from "next/server";
import { incrementDealImpressions } from "@/lib/deals/claim";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const impressionsSchema = z.object({
  dealIds: z.array(z.uuid()).min(1).max(10),
});

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "deal-impressions",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const parsed = impressionsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await incrementDealImpressions(parsed.data.dealIds);
  return NextResponse.json({ ok: true, count: parsed.data.dealIds.length });
}
