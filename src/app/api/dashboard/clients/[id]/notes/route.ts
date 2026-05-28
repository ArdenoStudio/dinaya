import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  clientNoteCreateSchema,
  createClientDashboardNote,
} from "@/lib/dashboard/clients";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const parsed = clientNoteCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Note body is required." }, { status: 400 });
  }

  const result = await createClientDashboardNote(businessId, id, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });

  return NextResponse.json(result.note, { status: 201 });
}
