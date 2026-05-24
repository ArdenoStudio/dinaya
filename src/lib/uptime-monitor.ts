import { promises as fs } from "node:fs";
import path from "node:path";

export type UptimeService = {
  name: string;
  url: string;
  icon?: string;
  slug: string;
  status: "up" | "down" | "degraded" | string;
  uptime: string;
  uptimeDay: string;
  uptimeWeek: string;
  uptimeMonth: string;
  uptimeYear: string;
  time: number;
  dailyMinutesDown?: Record<string, number>;
};

const DEFAULT_REPO = "ArdenoStudio/dinaya-uptime-monitor";
const DEFAULT_BRANCH = "master";
const SUMMARY_PATH = "history/summary.json";

const LOCAL_SUMMARY_FILE = path.join(
  process.cwd(),
  "dinaya-uptime-monitor",
  "history",
  "summary.json",
);

function githubRawUrl(repo: string, branch: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
}

function parseSummary(raw: string): UptimeService[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as UptimeService[];
  } catch {
    return null;
  }
}

async function fetchSummaryFromUrl(url: string): Promise<UptimeService[] | null> {
  const token = process.env.UPTIME_MONITOR_GITHUB_TOKEN?.trim();
  const headers: HeadersInit = {};
  if (token && url.includes("raw.githubusercontent.com")) {
    headers.Authorization = `token ${token}`;
  }

  const res = await fetch(url, {
    headers,
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  const raw = await res.text();
  return parseSummary(raw);
}

async function readLocalSummary(): Promise<UptimeService[] | null> {
  try {
    const raw = await fs.readFile(LOCAL_SUMMARY_FILE, "utf8");
    return parseSummary(raw);
  } catch {
    return null;
  }
}

/** Resolve candidate URLs for the Upptime-style summary.json file. */
export function getUptimeSummarySources(): string[] {
  const explicit = process.env.UPTIME_MONITOR_SUMMARY_URL?.trim();
  if (explicit) return [explicit];

  const repo = process.env.UPTIME_MONITOR_GITHUB_REPO?.trim() || DEFAULT_REPO;
  const branch = process.env.UPTIME_MONITOR_GITHUB_BRANCH?.trim() || DEFAULT_BRANCH;
  return [githubRawUrl(repo, branch, SUMMARY_PATH)];
}

/**
 * Load uptime monitor data for /admin/health.
 *
 * Production: set UPTIME_MONITOR_SUMMARY_URL (or UPTIME_MONITOR_GITHUB_* for a
 * private Upptime repo). Local dev: clone dinaya-uptime-monitor as a sibling
 * folder, or point the env var at a hosted summary.json.
 */
export async function fetchUptimeSummary(): Promise<UptimeService[] | null> {
  for (const url of getUptimeSummarySources()) {
    try {
      const summary = await fetchSummaryFromUrl(url);
      if (summary) return summary;
    } catch (err) {
      console.error("[uptime-monitor] fetch failed:", url, err instanceof Error ? err.message : err);
    }
  }

  return readLocalSummary();
}
