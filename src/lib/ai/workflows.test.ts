import { describe, expect, it } from "vitest";
import { AI_FEATURES } from "@/lib/plan";
import { canRunAiWorkflow, cooldownHasElapsed } from "./workflows";

describe("AI workflow eligibility", () => {
  it("allows every AI workflow on Max but not Free or Pro", () => {
    for (const feature of AI_FEATURES) {
      expect(canRunAiWorkflow("free", feature)).toBe(false);
      expect(canRunAiWorkflow("pro", feature)).toBe(false);
      expect(canRunAiWorkflow("max", feature)).toBe(true);
    }
  });

  it("enforces contact cooldown windows", () => {
    const now = new Date("2026-05-21T12:00:00.000Z");

    expect(cooldownHasElapsed(null, 30, now)).toBe(true);
    expect(cooldownHasElapsed(new Date("2026-05-01T12:00:00.000Z"), 30, now)).toBe(false);
    expect(cooldownHasElapsed(new Date("2026-04-01T12:00:00.000Z"), 30, now)).toBe(true);
    expect(cooldownHasElapsed("not-a-date", 30, now)).toBe(false);
  });
});
