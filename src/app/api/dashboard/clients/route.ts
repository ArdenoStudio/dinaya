import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const q = searchParams.get("q");

  let query = db
    .select()
    .from(clients)
    .where(eq(clients.businessId, businessId))
    .$dynamic();

  if (stage) {
    query = query.where(eq(clients.stage, stage as "lead" | "prospect" | "active" | "churned"));
  }
  if (q) {
    query = query.where(
      or(
        ilike(clients.name, `%${q}%`),
        ilike(clients.phone, `%${q}%`),
        ilike(clients.email, `%${q}%`)
      )
    );
  }

  const rows = await query.orderBy(desc(clients.createdAt));
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
