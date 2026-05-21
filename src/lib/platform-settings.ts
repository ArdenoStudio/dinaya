import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";

export async function getPlatformSetting<T>(key: string): Promise<T | null> {
  try {
    const [row] = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, key))
      .limit(1);
    return (row?.value as T | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function setPlatformSetting<T>(
  key: string,
  value: T,
  updatedBy?: string,
): Promise<void> {
  await db
    .insert(platformSettings)
    .values({
      key,
      value,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: {
        value,
        updatedBy: updatedBy ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function deletePlatformSetting(key: string): Promise<void> {
  await db.delete(platformSettings).where(eq(platformSettings.key, key));
}
