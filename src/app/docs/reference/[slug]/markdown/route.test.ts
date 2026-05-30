import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/docs/reference/[slug]/markdown", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("returns markdown for known reference pages", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const res = await GET(new Request("https://dinaya.lk/docs/reference/plan-limits/markdown"), {
      params: Promise.resolve({ slug: "plan-limits" }),
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(body).toContain("# Plan limits");
  });

  it("returns 404 for unknown references", async () => {
    const res = await GET(new Request("https://dinaya.lk/docs/reference/missing/markdown"), {
      params: Promise.resolve({ slug: "missing" }),
    });

    expect(res.status).toBe(404);
  });
});
