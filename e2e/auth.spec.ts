import { test, expect } from "@playwright/test";
import {
  makeAccount,
  loginViaApi,
  registerViaApi,
} from "./helpers/auth";

test.describe("Auth & registration", () => {
  test("shows password field on register step 1", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue/i })).toBeVisible();
  });

  test("rejects short password on step 1", async ({ page, request }) => {
    const account = makeAccount("short-pw");
    const res = await request.post("/api/auth/register", {
      data: {
        name: account.name,
        email: account.email,
        password: "short",
        businessName: account.businessName,
        slug: account.slug,
        businessType: "salon_barber",
        language: "en",
      },
    });
    expect(res.status()).toBe(400);

    await page.goto("/register");
    const continueButton = page.getByRole("button", { name: /Continue/i });
    await expect(continueButton).toHaveAttribute("type", "button");
    await page.getByLabel("Your name").fill("Test User");
    await page.getByLabel("Email").fill("short-ui@test.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await continueButton.click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 15_000 });
  });

  test("registers a new account via UI", async ({ page }) => {
    const account = makeAccount("register-ui");
    await page.goto("/register");

    const continueButton = page.getByRole("button", { name: /Continue/i });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "button");
    await page.getByLabel("Your name").fill(account.name);
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await continueButton.click();

    await page.getByLabel("Business name").fill(account.businessName);
    await page.locator("#slug").fill(account.slug);
    await page.getByRole("button", { name: /Start free trial/i }).click();

    await page.waitForURL("**/auth/signin?registered=1**");
    await expect(page.getByText(/Account created/i)).toBeVisible();
  });

  test("logs in with valid credentials", async ({ page, request }) => {
    const account = makeAccount("login");
    await registerViaApi(request, account);
    await loginViaApi(page, request, account);
    await expect(page.getByRole("heading", { name: /Good day|Overview|Dashboard/i }).first()).toBeVisible();
  });

  test("shows error for invalid login", async ({ page, request }) => {
    const account = makeAccount("bad-login");
    await registerViaApi(request, account);
    await page.goto("/auth/signin");
    const signInButton = page.getByRole("button", { name: "Sign in" });
    await expect(signInButton).toHaveAttribute("type", "button");
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill("WrongPass999!");
    await signInButton.click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test("redirects unauthenticated users from dashboard to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/auth/signin**");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("register page links to sign in", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: /Sign in/i }).click();
    await page.waitForURL("**/auth/signin**");
  });

  test("sign-in page links to register", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("link", { name: /Create your booking page/i }).click();
    await page.waitForURL("**/register**");
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  });
});
