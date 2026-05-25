import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { resolveAuthRedirect } from "@/lib/auth-redirect";

describe("resolveAuthRedirect", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_DOMAIN;
  });

  afterEach(() => {
    process.env = env;
  });

  it("returns relative paths unchanged", () => {
    expect(resolveAuthRedirect("/auth/signin", "https://stale.vercel.app")).toBe(
      "/auth/signin",
    );
    expect(resolveAuthRedirect("/dashboard", "https://stale.vercel.app")).toBe("/dashboard");
  });

  it("allows same origin as baseUrl", () => {
    expect(
      resolveAuthRedirect("https://dinaya.lk/dashboard", "https://dinaya.lk"),
    ).toBe("https://dinaya.lk/dashboard");
  });

  it("allows NEXT_PUBLIC_APP_URL origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    expect(
      resolveAuthRedirect(
        "https://dinaya.lk/admin",
        "https://old-preview.vercel.app",
      ),
    ).toBe("https://dinaya.lk/admin");
  });

  it("blocks unknown external origins and falls back to /dashboard", () => {
    expect(
      resolveAuthRedirect("https://evil.example/phish", "https://dinaya.lk"),
    ).toBe("/dashboard");
  });

  it("allows VERCEL_URL deployment host", () => {
    process.env.VERCEL_URL = "dinaya-abc123-team.vercel.app";
    expect(
      resolveAuthRedirect(
        "https://dinaya-abc123-team.vercel.app/dashboard",
        "https://dinaya.lk",
      ),
    ).toBe("https://dinaya-abc123-team.vercel.app/dashboard");
  });

  it("allows VERCEL_PROJECT_PRODUCTION_URL host", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "dinaya-lk.vercel.app";
    expect(
      resolveAuthRedirect(
        "https://dinaya-lk.vercel.app/dashboard",
        "https://dinaya.lk",
      ),
    ).toBe("https://dinaya-lk.vercel.app/dashboard");
  });
});
