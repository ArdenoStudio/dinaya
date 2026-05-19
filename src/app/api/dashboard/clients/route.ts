import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { z } from "@/lib/validation";

const clientSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.email().optional().nullable().or(z.literal("")),
  stage: z.enum(["lead", "prospect", "active", "churned"]).optional(),
  source: z.string().trim().max(100).optional().nullable(),
  tags: z.array(z.string().trim().max(40)).optional().nullable(),
  internalNotes: z.string().trim().max(5000).optional().nullable(),
});

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

  const parsed = clientSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the client details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, stage, source, tags, internalNotes } = parsed.data;
  const phone = normalizeSriLankanPhone(parsed.data.phone);

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
