import { describe, expect, it, vi } from "vitest";
import { generateAiCopy } from "./copy";

describe("AI copy fallback", () => {
  it("generates deterministic local copy when no provider key is configured", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    const copy = await generateAiCopy({
      businessName: "Dinaya Demo Salon",
      clientName: "Nimal",
      feature: "clientReactivationCampaign",
      bookingUrl: "https://dinaya.lk/book/demo",
    });

    expect(copy.source).toBe("fallback");
    expect(copy.subject).toContain("Dinaya Demo Salon");
    expect(copy.body).toContain("https://dinaya.lk/book/demo");
    vi.unstubAllEnvs();
  });

  it("generates fallback content calendar copy without an AI provider", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    const copy = await generateAiCopy({
      businessName: "Dinaya Demo Salon",
      feature: "aiContentMachine",
      bookingUrl: "https://dinaya.lk/book/demo",
      locationName: "Colombo 07",
    });

    expect(copy.source).toBe("fallback");
    expect(copy.subject).toMatch(/content idea/i);
    expect(copy.body).toContain("Colombo 07");
    expect(copy.body).toContain("https://dinaya.lk/book/demo");
    vi.unstubAllEnvs();
  });
});
