import { describe, expect, it } from "vitest";
import { AI_FEATURES } from "@/lib/plan";
import { canRunAiWorkflow, cooldownHasElapsed } from "./workflows";

describe("AI workflow eligibility", () => {
  it("allows every AI workflow on Trial and Max but not Pro or Expired", () => {
    for (const feature of AI_FEATURES) {
      expect(canRunAiWorkflow("trial", feature)).toBe(true);
      expect(canRunAiWorkflow("pro", feature)).toBe(false);
      expect(canRunAiWorkflow("max", feature)).toBe(true);
      expect(canRunAiWorkflow("expired", feature)).toBe(false);
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
