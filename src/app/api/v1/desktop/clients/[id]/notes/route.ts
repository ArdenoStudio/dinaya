import { NextRequest, NextResponse } from "next/server";
import { requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import {
  clientNoteCreateSchema,
  createClientDashboardNote,
  getClientDashboardDetail,
} from "@/lib/dashboard/clients";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;
  const { id } = await params;

  const limited = await withRateLimit(req, {
    scope: "desktop-client-note-create",
    limit: 120,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const parsed = clientNoteCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Note body is required." }, { status: 400 });
  }

  const result = await createClientDashboardNote(businessId, id, parsed.data);
  if (result.status === "not_found") {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  const detail = await getClientDashboardDetail(businessId, id);
  if (!detail) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...detail,
    serverTime: new Date().toISOString(),
    webUrl: `/dashboard/clients/${id}`,
  }, { status: 201 });
}
