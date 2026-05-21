import { describe, expect, it } from "vitest";
import {
  parseAttributionFromSearchParams,
  resolveBookingSource,
  resolveClientSource,
} from "./booking-attribution";

describe("booking attribution", () => {
  it("parses UTM and referral params", () => {
    const params = new URLSearchParams("utm_source=instagram&ref=salon-abc&channel=directory");
    expect(parseAttributionFromSearchParams(params)).toEqual({
      utmSource: "instagram",
      utmMedium: null,
      utmCampaign: null,
      referralCode: "salon-abc",
      channel: "directory",
    });
  });

  it("maps attribution to booking and client sources", () => {
    const attribution = { referralCode: "glow-salon" };
    expect(resolveBookingSource(attribution)).toBe("referral");
    expect(resolveClientSource("referral", attribution)).toBe("referral:glow-salon");

    const instagram = { utmSource: "instagram" };
    expect(resolveBookingSource(instagram)).toBe("instagram");
    expect(resolveClientSource("instagram", instagram)).toBe("utm:instagram");
  });
});
