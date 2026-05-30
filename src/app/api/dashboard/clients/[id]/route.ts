import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getClientDashboardDetail } from "@/lib/dashboard/clients";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { z } from "@/lib/validation";

const clientPatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  email: z.email().optional().nullable().or(z.literal("")),
  stage: z.enum(["lead", "prospect", "active", "churned"]).optional(),
  source: z.string().trim().max(100).optional().nullable(),
  tags: z.array(z.string().trim().max(40)).optional().nullable(),
  internalNotes: z.string().trim().max(5000).optional().nullable(),
});

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const detail = await getClientDashboardDetail(businessId, id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(detail);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const parsed = clientPatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the client details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, phone, email, stage, source, tags, internalNotes } = parsed.data;

  const [updated] = await db
    .update(clients)
    .set({
      ...(name !== undefined && { name }),
	      ...(phone !== undefined && { phone: normalizeSriLankanPhone(phone) }),
      ...(email !== undefined && { email }),
      ...(stage !== undefined && { stage }),
      ...(source !== undefined && { source }),
      ...(tags !== undefined && { tags }),
      ...(internalNotes !== undefined && { internalNotes }),
    })
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)));

  return new NextResponse(null, { status: 204 });
}
