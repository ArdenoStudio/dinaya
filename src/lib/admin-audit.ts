import { promises as fs } from "node:fs";
import path from "node:path";

export type AdminAuditEvent = {
  at: string; // ISO timestamp
  actorEmail: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
};

const LOG_DIR = path.join(process.cwd(), ".dinaya");
const LOG_FILE = path.join(LOG_DIR, "admin-audit.log.jsonl");

async function ensureDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function logAdminEvent(
  event: Omit<AdminAuditEvent, "at">
): Promise<void> {
  await ensureDir();
  const line =
    JSON.stringify({ at: new Date().toISOString(), ...event }) + "\n";
  try {
    await fs.appendFile(LOG_FILE, line, "utf8");
  } catch {
    // best-effort logger; don't crash request
  }
}

export async function readAdminEvents(limit = 200): Promise<AdminAuditEvent[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const tail = lines.slice(-limit).reverse();
    return tail
      .map((l) => {
        try {
          return JSON.parse(l) as AdminAuditEvent;
        } catch {
          return null;
        }
      })
      .filter((e): e is AdminAuditEvent => e !== null);
  } catch {
    return [];
  }
}
