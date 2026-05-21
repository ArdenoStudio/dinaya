import { NextRequest, NextResponse } from "next/server";
import { runAiWorkflows } from "@/lib/ai/workflows";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runAiWorkflows();
  return NextResponse.json({ ok: true, summary });
}
