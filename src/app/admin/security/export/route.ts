import { NextResponse } from "next/server";
import { exportAdminEventsJsonl, readAdminEvents } from "@/lib/admin-audit";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export async function GET() {
  const admin = await requirePlatformAdmin();
  const events = await readAdminEvents(1000);
  const body = exportAdminEventsJsonl(events);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="dinaya-admin-audit-${admin.email.replace("@", "-")}.jsonl"`,
    },
  });
}
