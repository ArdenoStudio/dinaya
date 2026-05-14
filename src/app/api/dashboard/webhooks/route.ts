import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const list = await db.select().from(webhooks).where(eq(webhooks.businessId, businessId));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const { url, events, secret: providedSecret } = await req.json();
  if (!url || !events?.length) {
    return NextResponse.json({ error: "url and events are required" }, { status: 400 });
  }

  const secret = providedSecret || crypto.randomBytes(24).toString("hex");

  const [hook] = await db
    .insert(webhooks)
    .values({ businessId, url, events, secret })
    .returning();

  return NextResponse.json(hook, { status: 201 });
}
