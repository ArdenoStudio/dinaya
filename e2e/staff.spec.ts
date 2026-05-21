import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerAndLogin,
  registerLoginAndSetPlan,
} from "./helpers/auth";

test.describe("Staff — Free plan", () => {
  test("lists owner as initial staff member", async ({ page, request }) => {
    const account = makeAccount("staff-free");
    await registerAndLogin(page, request, account);
    await page.goto("/dashboard/staff");
    await expect(page.getByText(account.name)).toBeVisible();
  });

  test("blocks adding a second staff member on Free", async ({ page, request }) => {
    const account = makeAccount("staff-free-limit");
    await registerAndLogin(page, request, account);
    await page.goto("/dashboard/staff/new");
    await page.getByPlaceholder("Kamala Silva").fill("Second Stylist");
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page.getByText(/Upgrade to Pro/i)).toBeVisible();
  });
});

test.describe("Staff — Pro plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Pro plan");

  test("can add a second staff member on Pro", async ({ page, request }) => {
    const account = makeAccount("staff-pro");
    await registerLoginAndSetPlan(page, request, account, "pro");
    await page.goto("/dashboard/staff/new");
    await page.getByPlaceholder("Kamala Silva").fill("Second Stylist");
    await page.getByRole("button", { name: /Save/i }).click();
    await page.waitForURL("**/dashboard/staff**");
    await expect(page.getByText("Second Stylist")).toBeVisible();
  });

  test("shows Works at checkboxes when multiple locations exist", async ({ page, request }) => {
    const account = makeAccount("staff-locations");
    await registerLoginAndSetPlan(page, request, account, "pro");

    await page.goto("/dashboard/locations");
    await page.getByRole("button", { name: /Add location/i }).click();
    await page.getByPlaceholder("Colombo 7 branch").fill("Branch B");
    await page.getByRole("button", { name: /^Create$/i }).click();
    await expect(page.getByText("Branch B")).toBeVisible();

    await page.goto("/dashboard/staff/new");
    await expect(page.getByText("Works at")).toBeVisible();
  });

  test("new staff without location selection still saves", async ({ page, request }) => {
    const account = makeAccount("staff-default-loc");
    await registerLoginAndSetPlan(page, request, account, "pro");
    await page.goto("/dashboard/staff/new");
    await page.getByPlaceholder("Kamala Silva").fill("Auto Loc Staff");
    await page.getByRole("button", { name: /Save/i }).click();
    await page.waitForURL("**/dashboard/staff**");
    await expect(page.getByText("Auto Loc Staff")).toBeVisible();
  });
});
