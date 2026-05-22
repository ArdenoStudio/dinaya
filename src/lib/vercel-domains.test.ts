import { describe, expect, it } from "vitest";
import { getDnsInstructions, type VercelDomainConfig } from "./vercel-domains";

describe("Vercel domain helpers", () => {
  it("prefers recommended CNAME records when available", () => {
    const config: VercelDomainConfig = {
      configuredBy: null,
      misconfigured: true,
      recommendedCNAME: [{ rank: 1, value: "cname.vercel-dns.com" }],
      recommendedIPv4: [{ rank: 1, value: ["76.76.21.21"] }],
    };

    expect(getDnsInstructions("book.salon.lk", config)).toEqual([
      { type: "CNAME", host: "book.salon.lk", value: "cname.vercel-dns.com" },
    ]);
  });

  it("falls back to recommended A records", () => {
    const config: VercelDomainConfig = {
      configuredBy: null,
      misconfigured: true,
      recommendedIPv4: [{ rank: 1, value: ["76.76.21.21"] }],
    };

    expect(getDnsInstructions("salon.lk", config)).toEqual([
      { type: "A", host: "salon.lk", value: "76.76.21.21" },
    ]);
  });
});
