import { afterEach, describe, expect, it } from "vitest";
import { guidesBySlug } from "@content/docs/guides";
import { referencesBySlug } from "@content/docs/reference";
import {
  renderDocsHubMarkdown,
  renderGuideMarkdown,
  renderLlmsTxt,
  renderReferenceMarkdown,
} from "@/lib/docs/markdown";

describe("docs markdown rendering", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
      return;
    }
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("renders docs hub markdown with guide links", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const markdown = renderDocsHubMarkdown();

    expect(markdown).toContain("# Dinaya Documentation");
    expect(markdown).toContain("https://dinaya.lk/docs.md");
    expect(markdown).toContain("https://dinaya.lk/docs/guides/setup-booking-page");
  });

  it("renders a guide with step headings and metadata", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const guide = guidesBySlug["setup-booking-page"];
    const markdown = renderGuideMarkdown(guide);

    expect(markdown).toContain("# Set up your booking page");
    expect(markdown).toContain("## Steps");
    expect(markdown).toContain("### 1. Create your account");
    expect(markdown).toContain("Canonical: https://dinaya.lk/docs/guides/setup-booking-page");
  });

  it("renders reference markdown and llms index", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";
    const reference = referencesBySlug["plan-limits"];
    const markdown = renderReferenceMarkdown(reference);
    const llms = renderLlmsTxt();

    expect(markdown).toContain("# Plan limits");
    expect(markdown).toContain("https://dinaya.lk/docs/reference/plan-limits.md");
    expect(llms).toContain("# Dinaya LLM Docs Index");
    expect(llms).toContain("https://dinaya.lk/docs/guides/setup-booking-page.md");
  });
});
