import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getUptimeSummarySources } from "@/lib/uptime-monitor";

describe("getUptimeSummarySources", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.UPTIME_MONITOR_SUMMARY_URL;
    delete process.env.UPTIME_MONITOR_GITHUB_REPO;
    delete process.env.UPTIME_MONITOR_GITHUB_BRANCH;
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses explicit summary URL when set", () => {
    process.env.UPTIME_MONITOR_SUMMARY_URL = "https://example.com/summary.json";
    expect(getUptimeSummarySources()).toEqual(["https://example.com/summary.json"]);
  });

  it("builds GitHub raw URL from repo and branch defaults", () => {
    expect(getUptimeSummarySources()).toEqual([
      "https://raw.githubusercontent.com/ArdenoStudio/dinaya-uptime-monitor/master/history/summary.json",
    ]);
  });

  it("builds GitHub raw URL from custom repo and branch", () => {
    process.env.UPTIME_MONITOR_GITHUB_REPO = "Acme/status";
    process.env.UPTIME_MONITOR_GITHUB_BRANCH = "main";
    expect(getUptimeSummarySources()).toEqual([
      "https://raw.githubusercontent.com/Acme/status/main/history/summary.json",
    ]);
  });
});
