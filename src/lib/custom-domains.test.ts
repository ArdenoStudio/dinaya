import { describe, expect, it } from "vitest";
import { normalizeCustomDomain } from "./custom-domains";

describe("normalizeCustomDomain", () => {
  it("strips protocol and www prefix", () => {
    expect(normalizeCustomDomain("https://www.book.salon.lk/path")).toBe("book.salon.lk");
  });

  it("returns null for invalid hosts", () => {
    expect(normalizeCustomDomain("not-a-domain")).toBeNull();
    expect(normalizeCustomDomain("")).toBeNull();
  });
});
