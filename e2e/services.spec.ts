import { test, expect } from "@playwright/test";
import {
  createServiceViaApi,
  makeAccount,
  registerLoginAsStarter,
  registerLoginAndSetPlan,
  registerViaApi,
} from "./helpers/auth";

test.describe("Services — Free plan limit", () => {
  test("lists three preset services from registration", async ({ page, request }) => {
    const account = makeAccount("svc-free-list");
    await registerLoginAsStarter(page, request, account);
    await page.goto("/dashboard/services");
    await expect(page.getByText("Haircut")).toBeVisible();
    await expect(page.getByText("Beard trim")).toBeVisible();
    await expect(page.getByText("Hair colouring consultation")).toBeVisible();
  });

  test("blocks a sixth service on Free (5-service cap)", async ({ page, request }) => {
    const account = makeAccount("svc-free-cap");
    await registerLoginAsStarter(page, request, account);

    for (let i = 1; i <= 2; i++) {
      const result = await createServiceViaApi(page, `Extra Service ${i}`);
      expect(result.ok).toBe(true);
    }

    const fifth = await createServiceViaApi(page, "Fifth Service");
    expect(fifth.ok).toBe(true);

    const sixth = await createServiceViaApi(page, "Sixth Service");
    expect(sixth.ok).toBe(false);
    expect(sixth.status).toBe(402);
    expect(sixth.body.error).toMatch(/5 services/i);
  });

  test("shows plan limit error in new service UI on Free", async ({ page, request }) => {
    const account = makeAccount("svc-free-ui");
    await registerLoginAsStarter(page, request, account);

    for (let i = 1; i <= 2; i++) {
      await createServiceViaApi(page, `Fill Service ${i}`);
    }

    await page.goto("/dashboard/services/new");
    await page.getByLabel("Service name *").fill("Sixth Via UI");
    await page.getByRole("button", { name: "Save service" }).click();
    await expect(page.getByText(/5 services/i)).toBeVisible();
  });
});

test.describe("Services — Pro plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Pro plan");

  test("allows more than five services on Pro", async ({ page, request }) => {
    const account = makeAccount("svc-pro");
    await registerLoginAndSetPlan(page, request, account, "pro");

    for (let i = 1; i <= 4; i++) {
      const result = await createServiceViaApi(page, `Pro Service ${i}`);
      expect(result.ok).toBe(true);
    }

    await page.goto("/dashboard/services");
    await expect(page.getByText("Pro Service 4")).toBeVisible();
  });
});

test.describe("Services — public visibility", () => {
  test("preset services appear on public booking page", async ({ page, request }) => {
    const account = makeAccount("svc-public");
    await registerViaApi(request, account);
    await page.goto(`/book/${account.slug}`);
    await expect(page.getByText("Haircut")).toBeVisible();
  });
});
