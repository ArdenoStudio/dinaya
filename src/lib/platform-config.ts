import { getPlatformSetting, setPlatformSetting, deletePlatformSetting } from "@/lib/platform-settings";
import type { Announcement } from "@/lib/platform-config-types";

export type { Announcement } from "@/lib/platform-config-types";

const ANNOUNCEMENT_KEY = "announcement";

export async function getAnnouncement(): Promise<Announcement | null> {
  const fromDb = await getPlatformSetting<Announcement>(ANNOUNCEMENT_KEY);
  if (fromDb) return fromDb;

  try {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const raw = await fs.readFile(path.join(process.cwd(), ".dinaya", "announcement.json"), "utf8");
    return JSON.parse(raw) as Announcement;
  } catch {
    return null;
  }
}

export async function saveAnnouncement(announcement: Announcement): Promise<void> {
  await setPlatformSetting(ANNOUNCEMENT_KEY, announcement, announcement.updatedBy);
  try {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".dinaya");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "announcement.json"), JSON.stringify(announcement, null, 2), "utf8");
  } catch {
    // optional local mirror
  }
}

export async function clearAnnouncement(): Promise<void> {
  await deletePlatformSetting(ANNOUNCEMENT_KEY);
  try {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    await fs.unlink(path.join(process.cwd(), ".dinaya", "announcement.json"));
  } catch {
    // ignore
  }
}
