import { describe, expect, it } from "vitest";
import { normalizePublicHttpsUrl, isPublicHttpsUrl } from "./public-url";

describe("public URL validation", () => {
  it("allows normalized public HTTPS URLs", () => {
    expect(normalizePublicHttpsUrl(" https://example.com/profile ")).toBe("https://example.com/profile");
    expect(isPublicHttpsUrl("https://example.com")).toBe(true);
  });

  it("rejects active or non-HTTPS schemes", () => {
    expect(normalizePublicHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(normalizePublicHttpsUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(normalizePublicHttpsUrl("http://example.com")).toBeNull();
  });

  it("rejects URLs with embedded credentials", () => {
    expect(normalizePublicHttpsUrl("https://user:pass@example.com")).toBeNull();
  });

  it("treats blank optional values as null", () => {
    expect(normalizePublicHttpsUrl(" ")).toBeNull();
    expect(normalizePublicHttpsUrl(null)).toBeNull();
  });
});
