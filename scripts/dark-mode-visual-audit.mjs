/**
 * Full dark-mode visual audit — screenshots + surface/contrast heuristics.
 * Run: AUDIT_BASE_URL=http://localhost:3002 node scripts/dark-mode-visual-audit.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3002";
const OUT = path.join(process.cwd(), ".audit-dark-mode");

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/features",
  "/solutions",
  "/about",
  "/contact",
  "/our-story",
  "/help",
  "/docs",
  "/docs/guides/setup-booking-page",
  "/whats-new",
  "/brand",
  "/discover",
  "/legal/privacy",
  "/legal/terms",
  "/legal/refund",
  "/auth/signin",
  "/register",
  "/forgot-password",
];

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/bookings",
  "/dashboard/calendar",
  "/dashboard/clients",
  "/dashboard/services",
  "/dashboard/settings",
  "/dashboard/availability",
  "/dashboard/billing",
];

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("dinaya-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await page.waitForTimeout(500);
}

async function auditPage(page) {
  return page.evaluate(() => {
    const offenders = { lightSurfaces: [], lowContrast: [], invisibleText: [] };

    const isLight = (rgb) => {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const [, r, g, b] = m.map(Number);
      return r > 235 && g > 235 && b > 235;
    };

    const walk = (el, depth = 0) => {
      if (depth > 10 || offenders.lightSurfaces.length > 30) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 28) return;
      if (isLight(style.backgroundColor) && parseFloat(style.opacity || "1") > 0.5) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === "string" ? el.className : "")
          .split(/\s+/)
          .slice(0, 5)
          .join(" ");
        offenders.lightSurfaces.push({
          kind: "light-surface",
          tag,
          cls: cls.slice(0, 100),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
      for (const child of el.children) walk(child, depth + 1);
    };
    walk(document.body);

    const interactive = document.querySelectorAll(
      "button, a, input, select, textarea, [role='button'], [role='tab'], label",
    );
    for (const el of interactive) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 20) continue;
      const text = (el.textContent ?? "").trim().slice(0, 40);
      const fg = style.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!fg) continue;
      const fr = Number(fg[1]);
      const fgG = Number(fg[2]);
      const fb = Number(fg[3]);
      let node = el;
      let bg = null;
      while (node && node !== document.body) {
        const b = getComputedStyle(node).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (b && !b[0].includes("0, 0, 0, 0") && !b[0].endsWith(", 0)")) {
          const a = b[0].includes("rgba") ? parseFloat(b[0].split(",").pop()) : 1;
          if (a > 0.5) {
            bg = { r: Number(b[1]), g: Number(b[2]), b: Number(b[3]) };
            break;
          }
        }
        node = node.parentElement;
      }
      if (!bg) continue;
      const lum = (c) => {
        const s = c / 255;
        const v = s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        return v;
      };
      const l1 = 0.2126 * lum(fr) + 0.7152 * lum(fgG) + 0.0722 * lum(fb);
      const l2 = 0.2126 * lum(bg.r) + 0.7152 * lum(bg.g) + 0.0722 * lum(bg.b);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const tag = el.tagName.toLowerCase();
      const cls = (el.className && typeof el.className === "string" ? el.className : "")
        .split(/\s+/)
        .slice(0, 4)
        .join(" ");
      if (ratio < 3 && text.length > 0) {
        offenders.lowContrast.push({
          kind: "low-contrast",
          tag,
          cls: cls.slice(0, 80),
          text,
          ratio: Math.round(ratio * 10) / 10,
        });
      }
      if (fr > 200 && fgG > 200 && fb > 200 && bg.r > 200 && bg.g > 200 && bg.b > 200) {
        offenders.invisibleText.push({
          kind: "invisible-text",
          tag,
          cls: cls.slice(0, 80),
          text,
        });
      }
    }

    return offenders;
  });
}

function slug(route) {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
}

async function auditRoute(page, route, report) {
  const url = `${BASE}${route}`;
  const entry = { route, url, dark: null, issues: [] };
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(800);
    await setTheme(page, "dark");
    const darkPath = path.join(OUT, `${slug(route)}-dark.png`);
    await page.screenshot({ path: darkPath, fullPage: true });
    entry.dark = darkPath;

    const audit = await auditPage(page);
    const all = [
      ...audit.lightSurfaces.slice(0, 10),
      ...audit.invisibleText.slice(0, 10),
      ...audit.lowContrast.slice(0, 15),
    ];
    entry.issues = all;
    entry.counts = {
      lightSurfaces: audit.lightSurfaces.length,
      invisibleText: audit.invisibleText.length,
      lowContrast: audit.lowContrast.length,
    };
    const total = all.length;
    console.log(
      total
        ? `⚠ ${route}: ${audit.lightSurfaces.length} light / ${audit.invisibleText.length} invisible / ${audit.lowContrast.length} low-contrast`
        : `✓ ${route}`,
    );
  } catch (err) {
    entry.error = String(err);
    console.log(`✗ ${route}: ${err.message ?? err}`);
  }
  report.push(entry);
}

async function registerTestUser(context) {
  const suffix = `${Date.now()}`;
  const account = {
    email: `audit-dark-${suffix}@dinaya.test`,
    password: "AuditPass123!",
    name: "Audit User",
    businessName: `Audit Biz ${suffix}`,
    slug: `audit-${suffix}`,
  };
  const res = await context.request.post(`${BASE}/api/auth/register`, {
    data: {
      ...account,
      businessType: "salon_barber",
      language: "en",
    },
  });
  if (!res.ok()) {
    throw new Error(`Register failed: ${await res.text()}`);
  }
  const page = await context.newPage();
  await page.goto(`${BASE}/auth/signin`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 60000 });
  await page.close();
  return account;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const report = [];

  console.log(`Auditing public routes at ${BASE}…\n`);
  for (const route of PUBLIC_ROUTES) {
    await auditRoute(page, route, report);
  }

  console.log("\nAuditing dashboard (registering temp user)…\n");
  try {
    await registerTestUser(context);
    for (const route of DASHBOARD_ROUTES) {
      await auditRoute(page, route, report);
    }
  } catch (err) {
    console.log(`✗ Dashboard audit skipped: ${err.message ?? err}`);
    report.push({ route: "/dashboard/*", error: String(err) });
  }

  await browser.close();
  const reportPath = path.join(OUT, "report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  const withIssues = report.filter((r) => r.issues?.length);
  const critical = report.filter(
    (r) => r.counts?.invisibleText > 0 || r.counts?.lowContrast > 5,
  );
  console.log(`\nScreenshots: ${OUT}`);
  console.log(`Routes flagged: ${withIssues.length}/${report.length}`);
  console.log(`Critical (invisible text or many low-contrast): ${critical.length}`);
  for (const r of critical) {
    console.log(`  ${r.route}:`, r.counts);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
