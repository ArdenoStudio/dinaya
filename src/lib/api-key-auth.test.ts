import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { hasApiKeyAuth } from "./api-key-auth";
import { generateApiKey } from "./api-keys";

describe("hasApiKeyAuth", () => {
  it("detects dinaya bearer tokens", () => {
    const { rawKey } = generateApiKey();
    const req = new NextRequest("http://localhost/api/dashboard/bookings", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    expect(hasApiKeyAuth(req)).toBe(true);
  });

  it("ignores non-dinaya bearer tokens", () => {
    const req = new NextRequest("http://localhost/api/dashboard/bookings", {
      headers: { Authorization: "Bearer sk_live_test" },
    });
    expect(hasApiKeyAuth(req)).toBe(false);
  });

  it("ignores missing authorization", () => {
    const req = new NextRequest("http://localhost/api/dashboard/bookings");
    expect(hasApiKeyAuth(req)).toBe(false);
  });
});
