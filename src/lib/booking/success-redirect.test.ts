import { describe, expect, it } from "vitest";
import {
  buildSuccessRedirectUrl,
  parseSuccessRedirectUrl,
} from "@/lib/booking/success-redirect";

const context = {
  bookingId: "abc",
  service: "Haircut",
  staff: "Sam",
  status: "confirmed",
  startsAt: "2026-06-17T10:00:00.000Z",
};

describe("success redirect URL validation", () => {
  it("accepts https URLs and same-site paths", () => {
    expect(parseSuccessRedirectUrl("https://example.com/thanks")).toBe("https://example.com/thanks");
    expect(parseSuccessRedirectUrl("/thank-you")).toBe("/thank-you");
  });

  it("rejects protocol-relative open redirects", () => {
    expect(parseSuccessRedirectUrl("//evil.com")).toBeNull();
    expect(parseSuccessRedirectUrl("//evil.com/path")).toBeNull();
  });

  it("rejects javascript and http URLs", () => {
    expect(parseSuccessRedirectUrl("javascript:alert(1)")).toBeNull();
    expect(parseSuccessRedirectUrl("http://example.com")).toBeNull();
  });
});

describe("buildSuccessRedirectUrl", () => {
  it("appends safe query params to absolute URLs", () => {
    const url = buildSuccessRedirectUrl("https://example.com/thanks", context);
    expect(url).toContain("bookingId=abc");
    expect(url.startsWith("https://example.com/thanks")).toBe(true);
  });

  it("appends params to relative paths", () => {
    const url = buildSuccessRedirectUrl("/thank-you", context);
    expect(url.startsWith("/thank-you?")).toBe(true);
  });
});
