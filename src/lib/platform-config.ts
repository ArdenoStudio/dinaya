import { promises as fs } from "node:fs";
import path from "node:path";

const CONFIG_DIR = path.join(process.cwd(), ".dinaya");
const ANNOUNCEMENT_FILE = path.join(CONFIG_DIR, "announcement.json");

export type Announcement = {
  message: string;
  tone: "info" | "warning" | "critical";
  active: boolean;
  updatedAt: string;
  updatedBy: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function getAnnouncement(): Promise<Announcement | null> {
  try {
    const raw = await fs.readFile(ANNOUNCEMENT_FILE, "utf8");
    return JSON.parse(raw) as Announcement;
  } catch {
    return null;
  }
}

export async function saveAnnouncement(a: Announcement): Promise<void> {
  await ensureDir();
  await fs.writeFile(ANNOUNCEMENT_FILE, JSON.stringify(a, null, 2), "utf8");
}

export async function clearAnnouncement(): Promise<void> {
  try {
    await fs.unlink(ANNOUNCEMENT_FILE);
  } catch {
    // ignore
  }
}
