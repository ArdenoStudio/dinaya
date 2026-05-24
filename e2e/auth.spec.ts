import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerViaApi,
  loginViaUi,
} from "./helpers/auth";

test.describe("Auth & registration", () => {
  test("shows password field on register step 1", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue/i })).toBeVisible();
  });

  test("rejects short password on step 1", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Your name").fill("Test User");
    await page.getByLabel("Email").fill("short-pw@test.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByRole("alert").first()).toContainText(/8 characters/i);
  });

  test("registers a new account via UI", async ({ page }) => {
    const account = makeAccount("register-ui");
    await page.goto("/register");

    await page.getByLabel("Your name").fill(account.name);
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: /Continue/i }).click();

    await page.getByLabel("Business name").fill(account.businessName);
    await page.locator("#slug").fill(account.slug);
    await page.getByRole("button", { name: /Create free account/i }).click();

    await page.waitForURL("**/auth/signin?registered=1**");
    await expect(page.getByText(/Account created/i)).toBeVisible();
  });

  test("logs in with valid credentials", async ({ page, request }) => {
    const account = makeAccount("login");
    await registerViaApi(request, account);
    await loginViaUi(page, account);
    await expect(page.getByRole("heading", { name: /Overview|Dashboard/i }).first()).toBeVisible();
  });

  test("shows error for invalid login", async ({ page, request }) => {
    const account = makeAccount("bad-login");
    await registerViaApi(request, account);
    await page.goto("/auth/signin");
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill("WrongPass999!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").first()).toContainText(/Invalid email or password/i);
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
    await page.getByRole("link", { name: /Create one free/i }).click();
    await page.waitForURL("**/register**");
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  });
});
