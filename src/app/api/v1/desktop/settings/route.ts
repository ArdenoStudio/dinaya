import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead, requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import { getDesktopSettingsData, revokeCurrentDesktopDevice } from "@/lib/dashboard/settings";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const patchSchema = z.object({
  revokeCurrentDevice: z.literal(true),
});

export async function GET(req: NextRequest) {
  const authResult = await requireDesktopRead(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId, keyId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-settings",
    limit: 180,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const settings = await getDesktopSettingsData(businessId, keyId);
  if (!settings) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...settings,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/settings",
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId, keyId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-settings-update",
    limit: 20,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings update." }, { status: 400 });
  }

  const revoked = await revokeCurrentDesktopDevice(businessId, keyId);
  if (!revoked) {
    return NextResponse.json({ error: "Current device not found." }, { status: 404 });
  }

  return NextResponse.json({
    revoked: true,
    revokedKeyId: revoked.id,
    serverTime: new Date().toISOString(),
  });
}
