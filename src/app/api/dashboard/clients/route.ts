import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const q = searchParams.get("q");

  const conditions = [
    eq(clients.businessId, businessId),
    stage ? eq(clients.stage, stage as "lead" | "prospect" | "active" | "churned") : undefined,
    q ? or(ilike(clients.name, `%${q}%`), ilike(clients.phone, `%${q}%`), ilike(clients.email, `%${q}%`)) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = await db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(desc(clients.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const body = await req.json();
  const { name, phone, email, stage, source, tags, internalNotes } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
  }

  const [client] = await db
    .insert(clients)
    .values({
      businessId,
      name,
      phone,
      email: email || null,
      stage: stage || "lead",
      source: source || null,
      tags: tags || null,
      internalNotes: internalNotes || null,
    })
    .returning();

  return NextResponse.json(client, { status: 201 });
}
