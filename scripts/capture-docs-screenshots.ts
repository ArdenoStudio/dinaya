/**
 * Captures dashboard screenshots for documentation.
 *
 * Usage:
 *   npm run dev   # in another terminal, port 3000 or 3001
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx tsx scripts/capture-docs-screenshots.ts
 *
 * Requires DATABASE_URL for registering a demo account.
 */

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const outDir = path.join(process.cwd(), "public/docs/screenshots");

type CaptureTarget = {
  name: string;
  path: string;
  waitFor?: string;
};

const targets: CaptureTarget[] = [
  { name: "dashboard-overview", path: "/dashboard" },
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

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const account = await registerDemoAccount();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 60_000 });

  for (const target of targets) {
    await page.goto(`${baseURL}${target.path}`);
    await page.waitForLoadState("networkidle");
    const file = path.join(outDir, `${target.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`Saved ${file}`);
  }

  await browser.close();
  console.log("Done. Wire screenshots in guide content with visual.type = 'screenshot'.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
