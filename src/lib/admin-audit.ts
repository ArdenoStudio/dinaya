import { promises as fs } from "node:fs";
import path from "node:path";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditEvents } from "@/db/schema";
import { hashAdminAuditPayload } from "@/lib/platform-admin-members";

export type AdminAuditEvent = {
  at: string;
  actorEmail: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  previousHash?: string;
  eventHash?: string;
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

function buildEventHash(event: Omit<AdminAuditEvent, "eventHash">): string {
  const payload = JSON.stringify({
    at: event.at,
    actorEmail: event.actorEmail,
    action: event.action,
    target: event.target ?? null,
    meta: event.meta ?? null,
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null,
    previousHash: event.previousHash ?? null,
  });
  return hashAdminAuditPayload(payload);
}

async function getLatestEventHash(): Promise<string | null> {
  try {
    const [row] = await db
      .select({ eventHash: adminAuditEvents.eventHash })
      .from(adminAuditEvents)
      .orderBy(desc(adminAuditEvents.at))
      .limit(1);
    return row?.eventHash ?? null;
  } catch {
    return null;
  }
}

export async function logAdminEvent(
  event: Omit<AdminAuditEvent, "at" | "eventHash" | "previousHash"> & {
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  const previousHash = await getLatestEventHash();
  const base: Omit<AdminAuditEvent, "eventHash"> = {
    at: new Date().toISOString(),
    actorEmail: event.actorEmail,
    action: event.action,
    target: event.target,
    meta: event.meta,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    previousHash: previousHash ?? undefined,
  };
  const full: AdminAuditEvent = {
    ...base,
    eventHash: buildEventHash(base),
  };

  try {
    await db.insert(adminAuditEvents).values({
      at: new Date(full.at),
      actorEmail: full.actorEmail,
      action: full.action,
      target: full.target ?? null,
      meta: full.meta ?? null,
      ipAddress: full.ipAddress ?? null,
      userAgent: full.userAgent ?? null,
      previousHash: full.previousHash ?? null,
      eventHash: full.eventHash ?? null,
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
        ipAddress: row.ipAddress ?? undefined,
        userAgent: row.userAgent ?? undefined,
        previousHash: row.previousHash ?? undefined,
        eventHash: row.eventHash ?? undefined,
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

export function exportAdminEventsJsonl(events: AdminAuditEvent[]): string {
  return events.map((event) => JSON.stringify(event)).join("\n");
}

export function verifyAdminEventChain(events: AdminAuditEvent[]): boolean {
  const chronological = [...events].reverse();
  let expectedPrevious: string | null = null;

  for (const event of chronological) {
    if ((event.previousHash ?? null) !== expectedPrevious) {
      return false;
    }
    const recomputed = buildEventHash({
      at: event.at,
      actorEmail: event.actorEmail,
      action: event.action,
      target: event.target,
      meta: event.meta,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      previousHash: event.previousHash,
    });
    if (event.eventHash !== recomputed) {
      return false;
    }
    expectedPrevious = event.eventHash ?? null;
  }

  return true;
}

export function detectSuspiciousAdminActivity(events: AdminAuditEvent[]): string[] {
  const alerts: string[] = [];
  const byActor = new Map<string, AdminAuditEvent[]>();

  for (const event of events) {
    const list = byActor.get(event.actorEmail) ?? [];
    list.push(event);
    byActor.set(event.actorEmail, list);
  }

  for (const [email, actorEvents] of byActor) {
    const sensitive = actorEvents.filter((event) => event.action !== "admin.view");
    if (sensitive.length >= 10) {
      alerts.push(`${email} performed ${sensitive.length} sensitive admin actions in the recent window.`);
    }
  }

  const passwordResets = events.filter((event) => event.action === "support.reset_password");
  if (passwordResets.length >= 5) {
    alerts.push(`${passwordResets.length} password resets recorded — review for brute-force patterns.`);
  }

  return alerts;
}
