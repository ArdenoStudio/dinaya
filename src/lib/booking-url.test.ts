import { describe, expect, it } from "vitest";
import { buildPublicBookingUrl, expectedCustomDomainTarget } from "./booking-url";

describe("buildPublicBookingUrl", () => {
  it("prefers verified custom domains", () => {
    expect(buildPublicBookingUrl({
      slug: "salon",
      customDomain: "book.salon.lk",
      customDomainVerified: true,
    })).toBe("https://book.salon.lk");
  });

  it("builds subdomain URLs in production", () => {
    const previousDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
    process.env.NEXT_PUBLIC_APP_DOMAIN = "dinaya.lk";

    expect(buildPublicBookingUrl({ slug: "salon" })).toBe("https://salon.dinaya.lk");

    process.env.NEXT_PUBLIC_APP_DOMAIN = previousDomain;
  });

  it("returns expected CNAME target", () => {
    const previousDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
    process.env.NEXT_PUBLIC_APP_DOMAIN = "dinaya.lk";
    expect(expectedCustomDomainTarget("salon")).toBe("salon.dinaya.lk");
    process.env.NEXT_PUBLIC_APP_DOMAIN = previousDomain;
  });
});
