import { describe, expect, it } from "vitest";
import { appendReferralToUrl } from "./booking-attribution";
import { buildReferralBookingUrl } from "./referrals";

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
});
