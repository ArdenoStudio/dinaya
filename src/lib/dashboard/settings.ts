import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, businesses } from "@/db/schema";

export type DesktopSettingsData = Awaited<ReturnType<typeof getDesktopSettingsData>>;

export async function getDesktopSettingsData(businessId: string, currentKeyId: string) {
  const [business] = await db
    .select({
      address: businesses.address,
      customDomain: businesses.customDomain,
      directoryListed: businesses.directoryListed,
      email: businesses.email,
      id: businesses.id,
      name: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      phone: businesses.phone,
      plan: businesses.plan,
      slug: businesses.slug,
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) return null;

  const devices = await db
    .select({
      createdAt: apiKeys.createdAt,
      deviceId: apiKeys.deviceId,
      deviceName: apiKeys.deviceName,
      expiresAt: apiKeys.expiresAt,
      id: apiKeys.id,
      lastUsedAt: apiKeys.lastUsedAt,
      name: apiKeys.name,
      revokedAt: apiKeys.revokedAt,
      scopes: apiKeys.scopes,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.businessId, businessId), eq(apiKeys.keyType, "desktop")))
    .orderBy(desc(apiKeys.createdAt))
    .limit(50);

  return {
    business,
    currentKeyId,
    devices: devices.map((device) => ({
      ...device,
      createdAt: device.createdAt.toISOString(),
      expiresAt: device.expiresAt?.toISOString() ?? null,
      isCurrent: device.id === currentKeyId,
      lastUsedAt: device.lastUsedAt?.toISOString() ?? null,
      revokedAt: device.revokedAt?.toISOString() ?? null,
    })),
    summary: {
      activeDevices: devices.filter((device) => !device.revokedAt).length,
      currentDeviceRevoked: Boolean(devices.find((device) => device.id === currentKeyId)?.revokedAt),
      revokedDevices: devices.filter((device) => device.revokedAt).length,
      totalDevices: devices.length,
    },
  };
}

export async function revokeCurrentDesktopDevice(businessId: string, currentKeyId: string) {
  const [updated] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(apiKeys.id, currentKeyId),
      eq(apiKeys.businessId, businessId),
      eq(apiKeys.keyType, "desktop"),
    ))
    .returning({ id: apiKeys.id });

  return updated ?? null;
}
