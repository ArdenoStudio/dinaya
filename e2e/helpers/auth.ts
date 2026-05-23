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
