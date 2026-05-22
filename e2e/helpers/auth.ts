import type { APIRequestContext, Page } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

export type TestAccount = {
  name: string;
  email: string;
  password: string;
  businessName: string;
  slug: string;
};

export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  await page.goto("/login");
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

export async function setBusinessPlanByEmail(
  email: string,
  plan: "free" | "pro" | "max"
): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to set business plan in E2E tests.");
  }
  const sql = neon(url);
  await sql`
    UPDATE businesses
    SET plan = ${plan}
    WHERE id = (
      SELECT business_id FROM users WHERE email = ${email} LIMIT 1
    )
  `;
}

export async function registerLoginAndSetPlan(
  page: Page,
  request: APIRequestContext,
  account: TestAccount,
  plan: "free" | "pro" | "max"
): Promise<void> {
  await registerViaApi(request, account);
  await setBusinessPlanByEmail(account.email, plan);
  await loginViaUi(page, account);
}

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for this E2E helper.");
  }
  return neon(url);
}

export async function setBusinessContactByEmail(
  email: string,
  contact: { businessEmail?: string; phone?: string }
): Promise<void> {
  const sql = sqlClient();
  await sql`
    UPDATE businesses
    SET
      email = COALESCE(${contact.businessEmail ?? null}, email),
      phone = COALESCE(${contact.phone ?? null}, phone)
    WHERE id = (
      SELECT business_id FROM users WHERE email = ${email} LIMIT 1
    )
  `;
}

export async function enablePayhereForFirstService(email: string): Promise<{
  businessId: string;
  serviceId: string;
  staffId: string;
  locationId: string;
}> {
  const sql = sqlClient();
  const [business] = await sql`
    UPDATE businesses
    SET payhere_enabled = true,
        payhere_merchant_id = '1211149',
        payhere_merchant_secret = 'e2e-secret'
    WHERE id = (
      SELECT business_id FROM users WHERE email = ${email} LIMIT 1
    )
    RETURNING id
  `;
  if (!business) throw new Error("Business not found for PayHere helper.");

  const [service] = await sql`
    UPDATE services
    SET requires_payment = true,
        price_lkr = 1500,
        deposit_percent = 0
    WHERE id = (
      SELECT id FROM services WHERE business_id = ${business.id} ORDER BY created_at ASC LIMIT 1
    )
    RETURNING id
  `;
  const [member] = await sql`
    SELECT id FROM staff WHERE business_id = ${business.id} ORDER BY created_at ASC LIMIT 1
  `;
  const [location] = await sql`
    SELECT id FROM locations WHERE business_id = ${business.id} ORDER BY is_default DESC, created_at ASC LIMIT 1
  `;

  if (!service || !member || !location) {
    throw new Error("Seeded service, staff, or location missing.");
  }

  return {
    businessId: String(business.id),
    serviceId: String(service.id),
    staffId: String(member.id),
    locationId: String(location.id),
  };
}
