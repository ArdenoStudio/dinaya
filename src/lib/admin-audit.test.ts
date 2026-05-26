import { describe, expect, it } from "vitest";
import {
  detectSuspiciousAdminActivity,
  exportAdminEventsJsonl,
  verifyAdminEventChain,
  type AdminAuditEvent,
} from "./admin-audit";

describe("admin audit security", () => {
  it("exports jsonl and validates empty chains", () => {
    const events: AdminAuditEvent[] = [
      {
        at: "2026-05-25T10:00:00.000Z",
        actorEmail: "admin@dinaya.lk",
        action: "admin.view",
      },
    ];

    expect(verifyAdminEventChain([])).toBe(true);
    expect(exportAdminEventsJsonl(events)).toContain("admin@dinaya.lk");
  });

  it("flags repeated password resets", () => {
    const events = Array.from({ length: 10 }, (_, index) => ({
      at: `2026-05-25T10:0${index}:00.000Z`,
      actorEmail: "admin@dinaya.lk",
      action: "support.reset_password",
    }));
    const alerts = detectSuspiciousAdminActivity(events);
    expect(alerts.some((alert) => alert.includes("password resets"))).toBe(true);
  });
});
