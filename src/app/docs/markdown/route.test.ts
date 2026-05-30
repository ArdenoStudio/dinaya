import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/docs/markdown", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("returns markdown docs hub content", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const res = await GET();
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(body).toContain("# Dinaya Documentation");
    expect(body).toContain("https://dinaya.lk/docs.md");
  });
});
