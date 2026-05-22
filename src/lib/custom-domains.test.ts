import { describe, expect, it } from "vitest";
import { isReservedAppDomain, normalizeCustomDomain } from "./custom-domains";

describe("normalizeCustomDomain", () => {
  it("strips protocol and www prefix", () => {
    expect(normalizeCustomDomain("https://www.book.salon.lk/path")).toBe("book.salon.lk");
  });

  it("returns null for invalid hosts", () => {
    expect(normalizeCustomDomain("not-a-domain")).toBeNull();
    expect(normalizeCustomDomain("")).toBeNull();
    expect(normalizeCustomDomain("*.example.com")).toBeNull();
    expect(normalizeCustomDomain("bad_label.example.com")).toBeNull();
  });

  it("detects reserved Dinaya app domains", () => {
    const previous = process.env.NEXT_PUBLIC_APP_DOMAIN;
    process.env.NEXT_PUBLIC_APP_DOMAIN = "dinaya.lk";

    expect(isReservedAppDomain("dinaya.lk")).toBe(true);
    expect(isReservedAppDomain("salon.dinaya.lk")).toBe(true);
    expect(isReservedAppDomain("book.salon.lk")).toBe(false);

    process.env.NEXT_PUBLIC_APP_DOMAIN = previous;
  });
});
