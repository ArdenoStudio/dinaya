import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

export type TestAccount = {
  name: string;
  email: string;
  password: string;
  businessName: string;
  slug: string;
};

export type PlanTier = "free" | "pro" | "max";

export type GatedRoute = {
  path: string;
  requiredPlan: "pro" | "max";
  /** Visible when the plan gate is lifted */
  accessHeading: string | RegExp;
};

/** Pro-gated dashboard routes (Free users see upgrade wall). */
export const PRO_GATED_ROUTES: GatedRoute[] = [
  { path: "/dashboard/automations", requiredPlan: "pro", accessHeading: "Automations" },
  { path: "/dashboard/broadcasts", requiredPlan: "pro", accessHeading: "Broadcasts" },
  { path: "/dashboard/reports", requiredPlan: "pro", accessHeading: "Analytics & Reports" },
  { path: "/dashboard/settings/webhooks", requiredPlan: "pro", accessHeading: "Webhooks" },
  { path: "/dashboard/settings/api-keys", requiredPlan: "pro", accessHeading: "Create API key" },
];

/** Max-gated dashboard routes (Free and Pro users see upgrade wall). */
export const MAX_GATED_ROUTES: GatedRoute[] = [
  { path: "/dashboard/ai", requiredPlan: "max", accessHeading: "AI Growth Hub" },
  {
    path: "/dashboard/settings/voice-receptionist",
    requiredPlan: "max",
    accessHeading: "Conversation rules",
  },
];

/** Dashboard pages that should load on every plan without an upgrade gate. */
export const ALWAYS_AVAILABLE_ROUTES: { path: string; heading: string | RegExp }[] = [
  { path: "/dashboard", heading: /Good day/i },
  { path: "/dashboard/calendar", heading: "Calendar" },
  { path: "/dashboard/bookings", heading: "Bookings" },
  { path: "/dashboard/clients", heading: "Clients" },
  { path: "/dashboard/availability", heading: "Availability" },
  { path: "/dashboard/marketing", heading: "Marketing" },
  { path: "/dashboard/billing", heading: "Billing" },
  { path: "/dashboard/settings", heading: "Settings" },
];

export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Next Mon–Sat date string (yyyy-MM-dd) for reliable booking slot e2e. */
export function nextBookableDate(): string {
  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 1);
  while (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1);
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
}

export function makeAccount(label: string): TestAccount {
  const suffix = uniqueSuffix();
  return {
    name: `Test ${label}`,
    email: `e2e-${label}-${suffix}@dinaya.test`,
    password: "TestPass123!",
    businessName: `E2E ${label} ${suffix}`,
    slug: `e2e-${label}-${suffix}`,
  };
}

export function planDisplayLabel(plan: "pro" | "max"): string {
  return plan === "pro" ? "Pro" : "Max";
}

export async function registerViaApi(
  request: APIRequestContext,
  account: TestAccount
): Promise<void> {
  const res = await request.post("/api/auth/register", {
    data: {
      name: account.name,
      email: account.email,
      password: account.password,
      businessName: account.businessName,
      slug: account.slug,
      businessType: "salon_barber",
      language: "en",
    },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Register failed (${res.status()}): ${body}`);
  }
}

export async function loginViaUi(page: Page, account: TestAccount): Promise<void> {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**");
}

export async function registerAndLogin(
  page: Page,
  request: APIRequestContext,
  account: TestAccount
): Promise<void> {
  await registerViaApi(request, account);
  await loginViaUi(page, account);
}

function defaultPlanExpiresAt(plan: PlanTier): Date | null {
  if (plan === "free") return null;
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export async function setBusinessPlanByEmail(
  email: string,
  plan: PlanTier,
  options?: { planExpiresAt?: Date | null }
): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to set business plan in E2E tests.");
  }
  const planExpiresAt =
    options && "planExpiresAt" in options ? options.planExpiresAt : defaultPlanExpiresAt(plan);

  const sql = neon(url);
  await sql`
    UPDATE businesses
    SET plan = ${plan}, plan_expires_at = ${planExpiresAt}
    WHERE id = (
      SELECT business_id FROM users WHERE email = ${email} LIMIT 1
    )
  `;
}

export async function registerLoginAndSetPlan(
  page: Page,
  request: APIRequestContext,
  account: TestAccount,
  plan: PlanTier
): Promise<void> {
  await registerViaApi(request, account);
  await setBusinessPlanByEmail(account.email, plan);
  await loginViaUi(page, account);
}

export async function visitAndExpectUpgradeGate(
  page: Page,
  path: string,
  requiredPlan: "pro" | "max"
): Promise<void> {
  await page.goto(path);
  await expect(page.getByText(`Upgrade to ${planDisplayLabel(requiredPlan)}`)).toBeVisible();
  await expect(page.getByRole("link", { name: /View plan options/i })).toBeVisible();
}

export async function visitAndExpectFeatureAccess(
  page: Page,
  path: string,
  heading: string | RegExp
): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page.getByText(/Upgrade to (Pro|Max)/i)).not.toBeVisible();
}

export async function createServiceViaApi(
  page: Page,
  name: string
): Promise<{ ok: boolean; status: number; body: { error?: string } }> {
  const res = await page.request.post("/api/dashboard/services", {
    data: {
      name,
      durationMinutes: 30,
      priceLkr: 1000,
      description: `E2E service ${name}`,
    },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok(), status: res.status(), body };
}

export async function seedReviewByEmail(
  email: string,
  input?: { clientName?: string; rating?: number; comment?: string }
): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to seed reviews in E2E tests.");
  }
  const sql = neon(url);
  await sql`
    INSERT INTO reviews (business_id, client_name, rating, comment, is_published)
    SELECT business_id, ${input?.clientName ?? "E2E Reviewer"}, ${input?.rating ?? 5}, ${
      input?.comment ?? "Great experience!"
    }, true
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
}

export async function addLocations(
  page: Page,
  names: string[]
): Promise<void> {
  for (const name of names) {
    await page.goto("/dashboard/locations");
    await page.getByRole("button", { name: /Add location/i }).click();
    await page.getByPlaceholder("Colombo 7 branch").fill(name);
    await page.getByRole("button", { name: /^Create$/i }).click();
    await expect(page.getByText(name)).toBeVisible();
  }
}
