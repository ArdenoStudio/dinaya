import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerAndLogin,
  registerLoginAndSetPlan,
} from "./helpers/auth";

test.describe("AI Hub — Free plan", () => {
  test("shows upgrade gate for Free users", async ({ page, request }) => {
    const account = makeAccount("ai-free");
    await registerAndLogin(page, request, account);
    await page.goto("/dashboard/ai");
    await expect(page.getByRole("heading", { name: /AI Growth Hub/i })).toBeVisible();
    await expect(page.getByText(/available on Dinaya Pro/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Upgrade to Pro/i })).toBeVisible();
  });

  test("does not show per-branch AI toggles on Free", async ({ page, request }) => {
    const account = makeAccount("ai-free-toggles");
    await registerAndLogin(page, request, account);
    await page.goto("/dashboard/ai");
    await expect(page.getByText("AI Booking Autopilot")).not.toBeVisible();
  });
});

test.describe("AI Hub — Max plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Max plan");

  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("ai-max");
    await registerLoginAndSetPlan(page, request, account, "max");
    await page.goto("/dashboard/ai");
    await expect(page.getByRole("heading", { name: "AI Growth Hub" })).toBeVisible();
  });

  test("shows per-branch AI section for default location", async ({ page }) => {
    await expect(page.getByText("AI Booking Autopilot")).toBeVisible();
    await expect(page.getByText("Smart Reminder System")).toBeVisible();
    await expect(page.getByText("Review Engine")).toBeVisible();
  });

  test("lists all seven AI features", async ({ page }) => {
    const features = [
      "AI Booking Autopilot",
      "Smart Reminder System",
      "Review Engine",
      "Client Reactivation",
      "AI Upsell Assistant",
      "30-Day Content Machine",
      "VIP Loyalty Sequence",
    ];
    for (const feature of features) {
      await expect(page.getByText(feature)).toBeVisible();
    }
  });

  test("can toggle an AI feature on", async ({ page }) => {
    const toggle = page.getByText("AI Booking Autopilot").locator("..").locator("..").getByRole("checkbox").first();
    await toggle.check();
    await expect(toggle).toBeChecked();
  });

  test("can toggle an AI feature off", async ({ page }) => {
    const toggle = page.getByText("Review Engine").locator("..").locator("..").getByRole("checkbox").first();
    await toggle.check();
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
  });

  test("shows branch name header", async ({ page, request }) => {
    const account = makeAccount("ai-max-branch");
    await registerLoginAndSetPlan(page, request, account, "max");
    await page.goto("/dashboard/ai");
    await expect(page.getByText("Default")).toBeVisible();
  });

  test("links to locations when none exist is not shown after registration", async ({ page }) => {
    await expect(page.getByText(/Manage locations/i)).not.toBeVisible();
  });
});
