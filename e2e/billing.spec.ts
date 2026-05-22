import { expect, test } from "@playwright/test";
import {
  makeAccount,
  registerAndLogin,
  setBusinessContactByEmail,
} from "./helpers/auth";

test.describe("Billing", () => {
  test("shows Free plan upgrade options", async ({ page, request }) => {
    const account = makeAccount("billing-free");
    await registerAndLogin(page, request, account);

    await page.goto("/dashboard/billing");

    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    await expect(page.getByText("Current plan")).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Upgrade to Pro" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pro — monthly/i })).toBeVisible();
  });

  test("creates a PayHere subscription checkout when billing is configured", async ({ page, request }) => {
    test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to update business contact.");
    test.skip(!process.env.DINAYA_PAYHERE_MERCHANT_ID, "DINAYA_PAYHERE_MERCHANT_ID required for billing checkout.");
    test.skip(!process.env.DINAYA_PAYHERE_MERCHANT_SECRET, "DINAYA_PAYHERE_MERCHANT_SECRET required for billing checkout.");
    test.skip(!process.env.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL required for billing checkout.");

    const account = makeAccount("billing-checkout");
    await registerAndLogin(page, request, account);
    await setBusinessContactByEmail(account.email, {
      businessEmail: account.email,
      phone: "0771234567",
    });

    const response = await page.evaluate(async () => {
      const res = await fetch("/api/billing/subscribe", {
        body: JSON.stringify({ interval: "monthly", plan: "pro" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      return { body: await res.json(), ok: res.ok, status: res.status };
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.body.checkoutUrl).toContain("payhere.lk");
    expect(response.body.formData.order_id).toBeTruthy();
    expect(response.body.formData.notify_url).toContain("/api/webhooks/payhere-subscription");
  });
});
