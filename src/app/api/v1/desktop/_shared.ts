import { NextRequest, NextResponse } from "next/server";
import { requireAnyApiKey, requireApiKey } from "@/lib/api-key-auth";
import { desktopNativeBookingsEnabled } from "@/lib/desktop-native";

export type DesktopAuthContext = {
  businessId: string;
  keyId: string;
  keyType: string;
  deviceId: string | null;
  deviceName: string | null;
  scopes: string[];
};

function featureDisabledResponse() {
  return NextResponse.json(
    { error: "Desktop native modules are not enabled for this business." },
    { status: 403 },
  );
}

export async function requireDesktopRead(req: NextRequest) {
  const keyResult = await requireAnyApiKey(req, ["desktop:read", "desktop:bookings"]);
  if (!keyResult.ok) return keyResult;
  if (!desktopNativeBookingsEnabled(keyResult.context.businessId)) {
    return { ok: false as const, response: featureDisabledResponse() };
  }
  return keyResult;
}

export async function requireDesktopBookings(req: NextRequest) {
  const keyResult = await requireApiKey(req, "desktop:bookings");
  if (!keyResult.ok) return keyResult;
  if (!desktopNativeBookingsEnabled(keyResult.context.businessId)) {
    return { ok: false as const, response: featureDisabledResponse() };
  }
  return keyResult;
}

export async function requireDesktopWrite(req: NextRequest) {
  const keyResult = await requireApiKey(req, "desktop:write");
  if (!keyResult.ok) return keyResult;
  if (!desktopNativeBookingsEnabled(keyResult.context.businessId)) {
    return { ok: false as const, response: featureDisabledResponse() };
  }
  return keyResult;
}
