import { describe, expect, it } from "vitest";
import {
  getDocsMarkdownPathForPage,
  getGuideInternalMarkdownPath,
  getGuideMarkdownPath,
  getInternalDocsMarkdownPath,
  getReferenceInternalMarkdownPath,
  getReferenceMarkdownPath,
} from "@/lib/docs/paths";

describe("docs markdown paths", () => {
  it("maps docs pages to markdown aliases", () => {
    expect(getDocsMarkdownPathForPage("/docs")).toBe("/docs.md");
    expect(getDocsMarkdownPathForPage("/docs/guides/setup-booking-page")).toBe(
      "/docs/guides/setup-booking-page.md",
    );
    expect(getDocsMarkdownPathForPage("/docs/reference/plan-limits")).toBe(
      "/docs/reference/plan-limits.md",
    );
  });

  it("maps markdown aliases to internal markdown routes", () => {
    const guideAlias = getGuideMarkdownPath("setup-booking-page");
    const referenceAlias = getReferenceMarkdownPath("plan-limits");

    expect(getInternalDocsMarkdownPath("/docs.md")).toBe("/docs/markdown");
    expect(getInternalDocsMarkdownPath(guideAlias)).toBe(
      getGuideInternalMarkdownPath("setup-booking-page"),
    );
    expect(getInternalDocsMarkdownPath(referenceAlias)).toBe(
      getReferenceInternalMarkdownPath("plan-limits"),
    );
    expect(getInternalDocsMarkdownPath("/docs/guides/setup-booking-page")).toBeNull();
  });
});

