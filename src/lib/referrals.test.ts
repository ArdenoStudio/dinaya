import { afterEach, describe, expect, it } from "vitest";
import { appendReferralToUrl } from "./booking-attribution";
import { buildPlatformReferralUrl, buildReferralBookingUrl } from "./referrals";

describe("referrals", () => {
  it("appends referral code to booking URLs", () => {
    const url = buildReferralBookingUrl({
      slug: "salon",
      referralCode: "salon",
    });
    expect(url).toContain("ref=salon");
  });

  it("appends ref param without breaking existing query params", () => {
    const url = appendReferralToUrl("https://salon.dinaya.lk?utm_source=instagram", "salon");
    expect(url).toContain("utm_source=instagram");
    expect(url).toContain("ref=salon");
  });

  it("builds platform referral URL with ref query param", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const url = buildPlatformReferralUrl("My-Salon");
    expect(url).toBe("https://dinaya.lk/register?ref=my-salon");
  });

  it("tolerates NEXT_PUBLIC_APP_URL without a scheme", () => {
    process.env.NEXT_PUBLIC_APP_URL = "dinaya.lk";
    const url = buildPlatformReferralUrl("salon");
    expect(url).toBe("https://dinaya.lk/register?ref=salon");
  });
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL;
});
