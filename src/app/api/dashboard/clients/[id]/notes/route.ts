import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients, clientNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  // Verify client belongs to this business
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)))
    .limit(1);

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Note body is required." }, { status: 400 });
  }

  const [note] = await db
    .insert(clientNotes)
    .values({ clientId: id, body: body.trim() })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
