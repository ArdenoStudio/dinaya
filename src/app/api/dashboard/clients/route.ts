import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import {
  getClientsDashboardList,
  isDashboardClientStageFilter,
  type DashboardClientStageFilter,
} from "@/lib/dashboard/clients";
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
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") || "all";
  const q = searchParams.get("q");
  if (!isDashboardClientStageFilter(stage)) {
    return NextResponse.json({ error: "stage is invalid." }, { status: 400 });
  }

  const rows = await getClientsDashboardList(businessId, {
    limit: 500,
    q: q?.trim() ?? "",
    stage: stage as DashboardClientStageFilter,
  });

  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = clientSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the client details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, stage, source, tags, internalNotes } = parsed.data;
  const phone = normalizeSriLankanPhone(parsed.data.phone);
  if (!phone || phone.length < 7) {
    return NextResponse.json(
      { error: "Please enter a valid Sri Lankan phone number.", fieldErrors: { phone: ["Invalid phone number."] } },
      { status: 400 },
    );
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
