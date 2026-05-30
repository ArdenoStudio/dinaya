import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/llms", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("returns a plain-text docs index for LLMs", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const res = await GET();
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(body).toContain("# Dinaya LLM Docs Index");
    expect(body).toContain("https://dinaya.lk/docs.md");
    expect(body).toContain("https://dinaya.lk/docs/reference/plan-limits.md");
  });
});
