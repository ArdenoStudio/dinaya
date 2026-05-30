import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/docs/guides/[slug]/markdown", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("returns markdown for known guides", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const res = await GET(new Request("https://dinaya.lk/docs/guides/setup-booking-page/markdown"), {
      params: Promise.resolve({ slug: "setup-booking-page" }),
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(body).toContain("# Set up your booking page");
    expect(body).toContain("## Steps");
  });

  it("returns 404 for unknown guides", async () => {
    const res = await GET(new Request("https://dinaya.lk/docs/guides/missing/markdown"), {
      params: Promise.resolve({ slug: "missing" }),
    });

    expect(res.status).toBe(404);
  });
});
