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

export type UptimeFetchError = {
  url: string;
  status?: number;
  message: string;
};

export type UptimeFetchResult = {
  services: UptimeService[] | null;
  error: UptimeFetchError | null;
};

const DEFAULT_REPO = "ArdenoStudio/dinaya-uptime-monitor";
const DEFAULT_BRANCHES = ["master", "main"] as const;
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

function githubContentsApiUrl(repo: string, branch: string, filePath: string): string {
  return `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;
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

function decodeGitHubContent(content: string, encoding: string): string | null {
  if (encoding !== "base64") return null;
  return Buffer.from(content, "base64").toString("utf8");
}

type FetchAttempt = {
  summary: UptimeService[] | null;
  error: UptimeFetchError | null;
};

async function fetchSummaryFromUrl(url: string): Promise<FetchAttempt> {
  const token = process.env.UPTIME_MONITOR_GITHUB_TOKEN?.trim();
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    if (url.includes("raw.githubusercontent.com")) {
      headers.Authorization = `token ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return {
        summary: null,
        error: {
          url,
          status: res.status,
          message: res.statusText || `HTTP ${res.status}`,
        },
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") && url.includes("api.github.com")) {
      const payload = (await res.json()) as {
        content?: string;
        encoding?: string;
        message?: string;
      };
      if (!payload.content) {
        return {
          summary: null,
          error: {
            url,
            message: payload.message ?? "GitHub API returned no content",
          },
        };
      }
      const raw = decodeGitHubContent(payload.content, payload.encoding ?? "base64");
      if (!raw) {
        return {
          summary: null,
          error: { url, message: "Unsupported GitHub content encoding" },
        };
      }
      const summary = parseSummary(raw);
      if (!summary) {
        return { summary: null, error: { url, message: "Invalid summary.json format" } };
      }
      return { summary, error: null };
    }

    const raw = await res.text();
    const summary = parseSummary(raw);
    if (!summary) {
      return { summary: null, error: { url, message: "Invalid summary.json format" } };
    }
    return { summary, error: null };
  } catch (err) {
    return {
      summary: null,
      error: {
        url,
        message: err instanceof Error ? err.message : "fetch_failed",
      },
    };
  }
}

async function readLocalSummary(): Promise<UptimeService[] | null> {
  try {
    const raw = await fs.readFile(LOCAL_SUMMARY_FILE, "utf8");
    return parseSummary(raw);
  } catch {
    return null;
  }
}

function resolveRepoAndBranches(): { repo: string; branches: string[] } {
  const repo = process.env.UPTIME_MONITOR_GITHUB_REPO?.trim() || DEFAULT_REPO;
  const explicitBranch = process.env.UPTIME_MONITOR_GITHUB_BRANCH?.trim();
  const branches = explicitBranch ? [explicitBranch] : [...DEFAULT_BRANCHES];
  return { repo, branches };
}

/** Resolve candidate URLs for the Upptime-style summary.json file. */
export function getUptimeSummarySources(): string[] {
  const explicit = process.env.UPTIME_MONITOR_SUMMARY_URL?.trim();
  if (explicit) return [explicit];

  const { repo, branches } = resolveRepoAndBranches();
  const token = process.env.UPTIME_MONITOR_GITHUB_TOKEN?.trim();
  const sources: string[] = [];

  if (token) {
    for (const branch of branches) {
      sources.push(githubContentsApiUrl(repo, branch, SUMMARY_PATH));
    }
  }

  for (const branch of branches) {
    sources.push(githubRawUrl(repo, branch, SUMMARY_PATH));
  }

  return sources;
}

/**
 * Load uptime monitor data for /admin/health.
 *
 * Production: set UPTIME_MONITOR_SUMMARY_URL (or UPTIME_MONITOR_GITHUB_* for a
 * private Upptime repo). Local dev: clone dinaya-uptime-monitor as a sibling
 * folder, or point the env var at a hosted summary.json.
 */
export async function fetchUptimeSummary(): Promise<UptimeFetchResult> {
  let lastError: UptimeFetchError | null = null;

  for (const url of getUptimeSummarySources()) {
    const attempt = await fetchSummaryFromUrl(url);
    if (attempt.summary) {
      return { services: attempt.summary, error: null };
    }
    if (attempt.error) {
      lastError = attempt.error;
      console.error(
        "[uptime-monitor] fetch failed:",
        url,
        attempt.error.status ?? "",
        attempt.error.message,
      );
    }
  }

  const local = await readLocalSummary();
  if (local) {
    return { services: local, error: null };
  }

  return { services: null, error: lastError };
}
