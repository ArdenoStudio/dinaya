import { describe, expect, it } from "vitest";
import { localizedSmsBody } from "./locale";

const ctx = {
  clientName: "Nimal",
  businessName: "Glow Salon",
  serviceName: "Haircut",
  when: "21 May, 3:00 PM",
  manageUrl: "https://dinaya.lk/client/abc",
};

describe("localizedSmsBody", () => {
  it("returns English confirmation SMS by default", () => {
    const body = localizedSmsBody(undefined, "confirmationSms", ctx);
    expect(body).toContain("Glow Salon");
    expect(body).toContain("confirmed");
  });

  it("returns Sinhala SMS when language is si", () => {
    const body = localizedSmsBody("si", "reminderSms", ctx);
    expect(body).toContain("Glow Salon");
    expect(body).not.toContain("Reminder:");
  });

  it("returns Tamil SMS when language is ta", () => {
    const body = localizedSmsBody("ta", "cancellationSms", ctx);
    expect(body).toContain("Glow Salon");
    expect(body).toContain("Nimal");
  });
});
