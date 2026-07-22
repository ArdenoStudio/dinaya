/**
 * Captures documentation screenshots.
 *
 * Live mode (real dashboard + booking — requires DATABASE_URL + running app):
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 DOCS_CAPTURE_MODE=live npx tsx scripts/capture-docs-screenshots.ts
 *
 * Preview mode (mockup frames — no database):
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 DOCS_CAPTURE_MODE=preview npx tsx scripts/capture-docs-screenshots.ts
 */

import { chromium, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { DOCS_PREVIEW_MOCKUP_IDS } from "../src/lib/docs/visuals";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const outDir = path.join(process.cwd(), "public/docs/screenshots");
const mode = process.env.DOCS_CAPTURE_MODE ?? "live";

type LiveTarget = {
  name: string;
  path: string;
  /** Text that indicates the page finished loading (not a skeleton). */
  ready: RegExp;
};

const liveTargets: LiveTarget[] = [
  { name: "dashboard-overview", path: "/dashboard", ready: /Good day|Today|New booking/i },
  { name: "dashboard-onboarding", path: "/dashboard/setup", ready: /setup|YOUR BOOKING PAGE|Business name|already complete/i },
  { name: "dashboard-bookings", path: "/dashboard/bookings", ready: /Bookings/i },
  { name: "dashboard-services", path: "/dashboard/services", ready: /Services|Add service/i },
  { name: "dashboard-staff", path: "/dashboard/staff", ready: /Staff|Add staff/i },
  { name: "dashboard-locations", path: "/dashboard/locations", ready: /Locations|branch/i },
  { name: "dashboard-availability", path: "/dashboard/availability", ready: /Availability|Weekly/i },
  { name: "dashboard-calendar", path: "/dashboard/calendar", ready: /Calendar/i },
  { name: "dashboard-clients", path: "/dashboard/clients", ready: /Clients/i },
  { name: "dashboard-reviews", path: "/dashboard/reviews", ready: /Reviews|Upgrade/i },
  { name: "dashboard-payments", path: "/dashboard/payments", ready: /Payments|Upgrade/i },
  { name: "dashboard-marketing", path: "/dashboard/marketing", ready: /Marketing|booking link|dinaya\.lk/i },
  { name: "dashboard-deals", path: "/dashboard/deals", ready: /Deals|Upgrade/i },
  { name: "dashboard-settings", path: "/dashboard/settings", ready: /Settings|Business profile/i },
  { name: "dashboard-integrations", path: "/dashboard/settings/integrations", ready: /Integrations|Google|Connect/i },
  { name: "dashboard-billing", path: "/dashboard/billing", ready: /Billing|Plan|Upgrade/i },
  { name: "dashboard-reports", path: "/dashboard/reports", ready: /Reports|Analytics|Upgrade/i },
  { name: "dashboard-ai", path: "/dashboard/ai", ready: /AI|Upgrade|Growth/i },
  { name: "dashboard-automations", path: "/dashboard/automations", ready: /Automations|Upgrade/i },
];

async function registerDemoAccount(): Promise<{
  email: string;
  password: string;
  slug: string;
}> {
  const suffix = Date.now();
  const email = `docs-demo-${suffix}@dinaya.test`;
  const password = "DocsDemo123!";
  const slug = `docs-demo-${suffix}`;
  const res = await fetch(`${baseURL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dilini Perera",
      email,
      password,
      businessName: "Dilini's Studio",
      slug,
      businessType: "salon_barber",
      language: "en",
    }),
  });
  if (!res.ok) {
    throw new Error(`Register failed: ${await res.text()}`);
  }
  return { email, password, slug };
}

function runScript(args: string[]) {
  const result = spawnSync("npx", ["tsx", ...args], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    console.warn(`Seed warning: ${args.join(" ")} exited ${result.status}`);
  }
}

function seedDemoBusiness(slug: string) {
  runScript(["scripts/seed-test-services.ts", slug, "--count", "6"]);
  runScript(["scripts/seed-test-availability.ts", slug]);
  runScript(["scripts/seed-test-staff.ts", slug]);
}

function completeOnboarding(email: string) {
  runScript(["scripts/docs-complete-onboarding.ts", email]);
}

async function hideDevChrome(page: Page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-next-badge-root],
      [data-nextjs-toast],
      #__next-build-watcher,
      [aria-label="Open Next.js Dev Tools"] {
        display: none !important;
        visibility: hidden !important;
      }
    `,
  }).catch(() => undefined);

  await page.evaluate(() => {
    document.querySelectorAll('a[href="/dashboard/billing"]').forEach((node) => {
      const text = node.textContent ?? "";
      if (/trial|subscribe|booking page is offline/i.test(text)) {
        (node as HTMLElement).style.display = "none";
      }
    });

    const rewrite = (value: string) =>
      value
        .replace(/https?:\/\/localhost:\d+/gi, "https://dinaya.lk")
        .replace(/https?:\/\/127\.0\.0\.1:\d+/gi, "https://dinaya.lk")
        .replace(/docs-demo-\d+/gi, "dilini");

    document.querySelectorAll("input, textarea").forEach((node) => {
      const el = node as HTMLInputElement | HTMLTextAreaElement;
      if (el.value && /localhost|127\.0\.0\.1|docs-demo-/i.test(el.value)) {
        el.value = rewrite(el.value);
        el.setAttribute("value", el.value);
      }
    });

    document.querySelectorAll("a[href], [href]").forEach((node) => {
      const el = node as HTMLAnchorElement;
      const href = el.getAttribute("href");
      if (href && /localhost|127\.0\.0\.1|docs-demo-/i.test(href)) {
        el.setAttribute("href", rewrite(href));
      }
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const text of nodes) {
      if (text.nodeValue && /localhost|127\.0\.0\.1|docs-demo-/i.test(text.nodeValue)) {
        text.nodeValue = rewrite(text.nodeValue);
      }
    }

    // Hide share/link cards that still expose local URLs after React hydration.
    document.querySelectorAll("section, article, div").forEach((node) => {
      const el = node as HTMLElement;
      const text = el.textContent ?? "";
      if (
        el.childElementCount < 12 &&
        /Share booking link/i.test(text) &&
        /localhost|127\.0\.0\.1|docs-demo-/i.test(text)
      ) {
        el.style.visibility = "hidden";
      }
    });
  }).catch(() => undefined);
}

async function settle(page: Page, ready?: RegExp) {
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await hideDevChrome(page);
  // Wait out Next.js streaming / skeleton chrome.
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "detached", timeout: 20_000 })
    .catch(() => undefined);
  if (ready) {
    try {
      await page.getByText(ready).first().waitFor({ state: "visible", timeout: 45_000 });
    } catch {
      console.warn(`Ready text not found (${ready}) — capturing anyway`);
    }
  }
  // Extra beat for client hydration after skeletons clear.
  await page.waitForTimeout(900);
  await hideDevChrome(page);
}

async function screenshotPage(page: Page, name: string) {
  // Re-run cleanup immediately before shutter — React can rehydrate localhost text.
  await hideDevChrome(page);
  await page.waitForTimeout(200);
  await hideDevChrome(page);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Saved ${file}`);
}

function cookieDomain(): string {
  const host = new URL(baseURL).hostname;
  return host === "localhost" ? "localhost" : host;
}

async function signInViaApi(page: Page, email: string, password: string) {
  console.log("Fetching CSRF token…");
  const csrfRes = await fetch(`${baseURL}/api/auth/csrf`);
  if (!csrfRes.ok) {
    throw new Error(`CSRF fetch failed (${csrfRes.status})`);
  }
  const setCookieHeaders = csrfRes.headers.getSetCookie?.() ?? [];
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfToken) {
    throw new Error("Missing CSRF token for sign-in");
  }

  const cookieJar = new Map<string, string>();
  for (const raw of setCookieHeaders) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }

  console.log("Posting credentials callback…");
  const body = new URLSearchParams({
    callbackUrl: "/dashboard",
    csrfToken,
    email,
    json: "true",
    password,
  });
  const res = await fetch(`${baseURL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body,
    redirect: "manual",
  });
  const status = res.status;
  if (status !== 200 && status !== 302) {
    throw new Error(`Login failed (${status}): ${await res.text()}`);
  }

  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }

  const session = cookieJar.get("authjs.session-token") ?? cookieJar.get("__Secure-authjs.session-token");
  if (!session) {
    throw new Error("Login did not set a session cookie");
  }

  const domain = cookieDomain();
  await page.context().addCookies(
    [...cookieJar.entries()].map(([name, value]) => ({
      name,
      value,
      domain,
      path: "/",
      httpOnly: true,
      secure: name.startsWith("__Secure-"),
      sameSite: "Lax" as const,
    })),
  );

  console.log("Opening dashboard with session cookie…");
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForURL("**/dashboard**", { timeout: 60_000 });
  console.log("Signed in via credentials API");
}

async function captureLive(page: Page) {
  const account = await registerDemoAccount();
  console.log(`Registered demo business ${account.slug}`);
  seedDemoBusiness(account.slug);
  console.log("Seeding complete — signing in…");
  await signInViaApi(page, account.email, account.password);

  // Capture setup wizard before marking onboarding complete.
  const onboarding = liveTargets.find((t) => t.name === "dashboard-onboarding");
  if (onboarding) {
    console.log(`Capturing ${onboarding.name} (${onboarding.path})`);
    await page.goto(`${baseURL}${onboarding.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await settle(page, onboarding.ready);
    await screenshotPage(page, onboarding.name);
  }

  completeOnboarding(account.email);
  // Refresh session page so shell chrome appears.
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await settle(page, /Good day|Today|New booking/i);

  for (const target of liveTargets) {
    if (target.name === "dashboard-onboarding") continue;
    console.log(`Capturing ${target.name} (${target.path})`);
    await page.goto(`${baseURL}${target.path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await settle(page, target.ready);
    await screenshotPage(page, target.name);
  }

  // PayHere lives under Settings in the product UI.
  const payhereFile = path.join(outDir, "dashboard-payhere.png");
  fs.copyFileSync(path.join(outDir, "dashboard-settings.png"), payhereFile);
  console.log(`Saved ${payhereFile} (copy of dashboard-settings)`);

  await captureBookingFlow(page, account.slug);
}

async function capturePreviewMockup(page: Page, mockupId: string) {
  // Use /dev/docs-preview — bare page without PublicNav / docs chrome.
  await page.goto(`${baseURL}/dev/docs-preview/${mockupId}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("[data-docs-capture-root]");
  await settle(page);
  const root = page.locator("[data-docs-capture-root]");
  const file = path.join(outDir, `${mockupId}.png`);
  await root.screenshot({ path: file });
  console.log(`Saved ${file} (preview mockup)`);
}

async function captureBookingFlow(page: Page, slug: string) {
  const bookingContext = page.context();
  const phone = await bookingContext.newPage();
  await phone.setViewportSize({ width: 390, height: 844 });

  const bookBase = `${baseURL}/book/${slug}`;

  await phone.goto(bookBase, { waitUntil: "domcontentloaded" });
  await settle(phone, /Select a service|Choose a service|services/i);
  await screenshotPage(phone, "booking-service");

  // Open the first service detail / booking flow.
  const serviceLink = phone.locator("a[href*='/book/']").filter({ hasText: /LKR|min/i }).first();
  if (await serviceLink.count()) {
    await serviceLink.click().catch(() => undefined);
  } else {
    await phone
      .locator("button, a, [role='button']")
      .filter({ hasText: /haircut|Buzz|Layer|LKR/i })
      .first()
      .click()
      .catch(() => undefined);
  }
  await settle(phone, /time|date|staff|available|Pick|Continue/i);
  await screenshotPage(phone, "booking-time");

  const slot = phone.locator("button").filter({ hasText: /^\d{1,2}:\d{2}/ }).first();
  if (await slot.count()) {
    await slot.click().catch(() => undefined);
    await settle(phone);
  }

  const toConfirm = phone.getByRole("button", { name: /continue|next|confirm|details|book/i }).first();
  if (await toConfirm.count()) {
    await toConfirm.click().catch(() => undefined);
    await settle(phone);
  }
  await screenshotPage(phone, "booking-confirm");

  // Manage / review need real booking tokens — use polished phone mockups instead of 404s.
  await capturePreviewMockup(page, "booking-manage");
  await capturePreviewMockup(page, "booking-review");

  await phone.close();
}

async function capturePreview(page: Page) {
  for (const mockupId of DOCS_PREVIEW_MOCKUP_IDS) {
    await capturePreviewMockup(page, mockupId);
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
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
