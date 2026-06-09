/**
 * Captures documentation screenshots.
 *
 * Live mode (real dashboard — requires DATABASE_URL + running app):
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 DOCS_CAPTURE_MODE=live npx tsx scripts/capture-docs-screenshots.ts
 *
 * Preview mode (mockup frames — no database):
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 DOCS_CAPTURE_MODE=preview npx tsx scripts/capture-docs-screenshots.ts
 */

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { DOCS_PREVIEW_MOCKUP_IDS } from "../src/lib/docs/visuals";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const outDir = path.join(process.cwd(), "public/docs/screenshots");
const mode = process.env.DOCS_CAPTURE_MODE ?? "live";

type LiveTarget = {
  name: string;
  path: string;
};

const liveTargets: LiveTarget[] = [
  { name: "dashboard-overview", path: "/dashboard" },
  { name: "dashboard-onboarding", path: "/dashboard/setup" },
  { name: "dashboard-bookings", path: "/dashboard/bookings" },
  { name: "dashboard-services", path: "/dashboard/services" },
  { name: "dashboard-staff", path: "/dashboard/staff" },
  { name: "dashboard-locations", path: "/dashboard/locations" },
  { name: "dashboard-availability", path: "/dashboard/availability" },
  { name: "dashboard-calendar", path: "/dashboard/calendar" },
  { name: "dashboard-clients", path: "/dashboard/clients" },
  { name: "dashboard-reviews", path: "/dashboard/reviews" },
  { name: "dashboard-payments", path: "/dashboard/payments" },
  { name: "dashboard-marketing", path: "/dashboard/marketing" },
  { name: "dashboard-settings", path: "/dashboard/settings" },
  { name: "dashboard-integrations", path: "/dashboard/settings/integrations" },
  { name: "dashboard-billing", path: "/dashboard/billing" },
  { name: "dashboard-reports", path: "/dashboard/reports" },
  { name: "dashboard-ai", path: "/dashboard/ai" },
  { name: "dashboard-automations", path: "/dashboard/automations" },
];

async function registerDemoAccount(): Promise<{ email: string; password: string }> {
  const suffix = Date.now();
  const email = `docs-demo-${suffix}@dinaya.test`;
  const password = "DocsDemo123!";
  const res = await fetch(`${baseURL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Docs Demo",
      email,
      password,
      businessName: `Docs Demo ${suffix}`,
      slug: `docs-demo-${suffix}`,
      businessType: "salon_barber",
      language: "en",
    }),
  });
  if (!res.ok) {
    throw new Error(`Register failed: ${await res.text()}`);
  }
  return { email, password };
}

async function captureLive(page: import("@playwright/test").Page) {
  const account = await registerDemoAccount();

  await page.goto(`${baseURL}/auth/signin`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 60_000 });

  for (const target of liveTargets) {
    await page.goto(`${baseURL}${target.path}`);
    await page.waitForLoadState("networkidle");
    const file = path.join(outDir, `${target.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`Saved ${file}`);
  }

  // PayHere settings share the settings page in live mode.
  const payhereFile = path.join(outDir, "dashboard-payhere.png");
  fs.copyFileSync(path.join(outDir, "dashboard-settings.png"), payhereFile);
  console.log(`Saved ${payhereFile} (copy of dashboard-settings)`);
}

async function capturePreview(page: import("@playwright/test").Page) {
  for (const mockupId of DOCS_PREVIEW_MOCKUP_IDS) {
    await page.goto(`${baseURL}/docs/preview/${mockupId}`);
    await page.waitForSelector("[data-docs-capture-root]");
    await page.waitForLoadState("networkidle");
    const root = page.locator("[data-docs-capture-root]");
    const file = path.join(outDir, `${mockupId}.png`);
    await root.screenshot({ path: file });
    console.log(`Saved ${file}`);
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  if (mode === "preview") {
    await capturePreview(page);
  } else {
    await captureLive(page);
  }

  await browser.close();
  console.log(`Done (${mode} mode). Screenshots in public/docs/screenshots/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
