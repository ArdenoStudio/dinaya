import { describe, expect, it } from "vitest";
import {
  isSafeResolvedWebhookAddress,
  isSafeWebhookDestination,
  isSafeWebhookUrl,
} from "./webhook-url";

describe("webhook URL validation", () => {
  it("rejects literal unsafe webhook hosts", () => {
    expect(isSafeWebhookUrl("https://localhost/webhook")).toBe(false);
    expect(isSafeWebhookUrl("https://127.0.0.1/webhook")).toBe(false);
    expect(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafeWebhookUrl("https://[::1]/webhook")).toBe(false);
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    await expect(
      isSafeWebhookDestination("https://hooks.example.com/dinaya", async () => [
        { address: "10.0.0.5", family: 4 },
      ]),
    ).resolves.toBe(false);
  });

  it("allows hostnames only when every resolved address is public", async () => {
    await expect(
      isSafeWebhookDestination("https://hooks.example.com/dinaya", async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
      ]),
    ).resolves.toBe(true);
  });

  it("rejects unsafe resolved IPv6 addresses", () => {
    expect(isSafeResolvedWebhookAddress("::1")).toBe(false);
    expect(isSafeResolvedWebhookAddress("fd00::1")).toBe(false);
    expect(isSafeResolvedWebhookAddress("fe80::1")).toBe(false);
    expect(isSafeResolvedWebhookAddress("::ffff:127.0.0.1")).toBe(false);
  });
});
