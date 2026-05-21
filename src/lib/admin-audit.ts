import { promises as fs } from "node:fs";
import path from "node:path";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditEvents } from "@/db/schema";

export type AdminAuditEvent = {
  at: string;
  actorEmail: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
};

const LOG_DIR = path.join(process.cwd(), ".dinaya");
const LOG_FILE = path.join(LOG_DIR, "admin-audit.log.jsonl");

async function appendFileFallback(event: AdminAuditEvent): Promise<void> {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(LOG_FILE, JSON.stringify(event) + "\n", "utf8");
  } catch {
    // best-effort
  }
}

export async function logAdminEvent(
  event: Omit<AdminAuditEvent, "at">,
): Promise<void> {
  const full: AdminAuditEvent = { at: new Date().toISOString(), ...event };

  try {
    await db.insert(adminAuditEvents).values({
      at: new Date(full.at),
      actorEmail: full.actorEmail,
      action: full.action,
      target: full.target ?? null,
      meta: full.meta ?? null,
    });
  } catch {
    await appendFileFallback(full);
  }
}

export async function readAdminEvents(limit = 200): Promise<AdminAuditEvent[]> {
  try {
    const rows = await db
      .select()
      .from(adminAuditEvents)
      .orderBy(desc(adminAuditEvents.at))
      .limit(limit);

    if (rows.length > 0) {
      return rows.map((row) => ({
        at: row.at.toISOString(),
        actorEmail: row.actorEmail,
        action: row.action,
        target: row.target ?? undefined,
        meta: (row.meta as Record<string, unknown> | null) ?? undefined,
      }));
    }
  } catch {
    // fall through to file
  }

  try {
    const raw = await fs.readFile(LOG_FILE, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    return lines
      .slice(-limit)
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line) as AdminAuditEvent;
        } catch {
          return null;
        }
      })
      .filter((event): event is AdminAuditEvent => event !== null);
  } catch {
    return [];
  }
}
