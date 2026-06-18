import { test, expect } from "@playwright/test";
import {
  ALWAYS_AVAILABLE_ROUTES,
  MAX_GATED_ROUTES,
  PRO_GATED_ROUTES,
  addLocations,
  createServiceViaApi,
  makeAccount,
  registerAndLogin,
  registerLoginAndSetPlan,
  registerViaApi,
  seedReviewByEmail,
  visitAndExpectFeatureAccess,
  visitAndExpectUpgradeGate,
} from "./helpers/auth";

test.describe("Plan features — Free plan", () => {
  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("plan-free");
    await registerAndLogin(page, request, account);
  });

  for (const route of PRO_GATED_ROUTES) {
    test(`blocks ${route.path} with Pro upgrade gate`, async ({ page }) => {
      await visitAndExpectUpgradeGate(page, route.path, route.requiredPlan);
    });
  }

  for (const route of MAX_GATED_ROUTES) {
    test(`blocks ${route.path} with Max upgrade gate`, async ({ page }) => {
      await visitAndExpectUpgradeGate(page, route.path, route.requiredPlan);
    });
  }

  for (const route of ALWAYS_AVAILABLE_ROUTES) {
    test(`loads ${route.path} without upgrade gate`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(page.getByText(/Upgrade to (Pro|Max)/i)).not.toBeVisible();
    });
  }

  test("integrations page shows Pro required for webhooks and Google Calendar", async ({ page }) => {
    await page.goto("/dashboard/settings/integrations");
    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
    const webhooksCard = page.locator("div.rounded-xl.border").filter({ hasText: "Webhooks" });
    await expect(webhooksCard.getByText("Pro required")).toBeVisible();
    const googleCard = page.locator("div.rounded-xl.border").filter({ hasText: "Google Calendar" });
    await expect(googleCard.getByText("Pro required")).toBeVisible();
  });

  test("reviews page hides AI reply generation on Free", async ({ page }) => {
    await page.goto("/dashboard/reviews");
    await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
    await expect(page.getByText("Upgrade to Max to generate AI replies")).not.toBeVisible();
  });

  test("public booking page loads without login", async ({ page, request }) => {
    const account = makeAccount("plan-free-book");
    await registerViaApi(request, account);
    await page.goto(`/book/${account.slug}`);
    await expect(page.getByText("Haircut")).toBeVisible();
  });
});

test.describe("Plan features — Pro plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Pro plan");

  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("plan-pro");
    await registerLoginAndSetPlan(page, request, account, "pro");
  });

  for (const route of PRO_GATED_ROUTES) {
    test(`allows ${route.path}`, async ({ page }) => {
      await visitAndExpectFeatureAccess(page, route.path, route.accessHeading);
    });
  }

  for (const route of MAX_GATED_ROUTES) {
    test(`still blocks ${route.path} with Max gate`, async ({ page }) => {
      await visitAndExpectUpgradeGate(page, route.path, route.requiredPlan);
    });
  }

  test("integrations page shows Google Calendar connect affordance", async ({ page }) => {
    await page.goto("/dashboard/settings/integrations");
    const googleCard = page.locator("div.rounded-xl.border").filter({ hasText: "Google Calendar" });
    await expect(googleCard.getByRole("link", { name: /Connect|Configure env|Connected/i })).toBeVisible();
    await expect(googleCard.getByText("Pro required")).not.toBeVisible();
  });

  test("can add a sixth service on Pro", async ({ page }) => {
    for (let i = 1; i <= 3; i++) {
      const result = await createServiceViaApi(page, `Extra Service ${i}`);
      expect(result.ok).toBe(true);
    }
    const sixth = await createServiceViaApi(page, "Sixth Service");
    expect(sixth.ok).toBe(true);
  });

  test("blocks a fourth location on Pro (3-location cap)", async ({ page }) => {
    await addLocations(page, ["Branch Two", "Branch Three"]);
    await expect(page.getByRole("button", { name: /Add location/i })).not.toBeVisible();
    await expect(page.getByText(/reached your plan limit of 3 locations/i)).toBeVisible();
  });

  test("reviews page still hides AI reply generation on Pro", async ({ page, request }) => {
    const account = makeAccount("plan-pro-reviews");
    await registerLoginAndSetPlan(page, request, account, "pro");
    await seedReviewByEmail(account.email);
    await page.goto("/dashboard/reviews");
    await expect(page.getByText("E2E Reviewer")).toBeVisible();
    await page.getByRole("button", { name: "Your reply" }).click();
    await expect(page.getByText("Upgrade to Max to generate AI replies")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate with AI" })).not.toBeVisible();
  });
});

test.describe("Plan features — Max plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Max plan");

  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("plan-max");
    await registerLoginAndSetPlan(page, request, account, "max");
  });

  for (const route of PRO_GATED_ROUTES) {
    test(`allows Pro feature ${route.path}`, async ({ page }) => {
      await visitAndExpectFeatureAccess(page, route.path, route.accessHeading);
    });
  }

  test("allows AI Hub with all seven features", async ({ page }) => {
    await visitAndExpectFeatureAccess(page, "/dashboard/ai", "AI Growth Hub");
    const features = [
      "AI Booking Autopilot",
      "Smart Reminder System",
      "Review Engine",
      "Client Reactivation",
      "AI Upsell Assistant",
      "30-Day Content Machine",
      "VIP Loyalty Sequence",
    ];
    for (const feature of features) {
      await expect(page.getByText(feature)).toBeVisible();
    }
  });

  test("allows voice receptionist setup", async ({ page }) => {
    await visitAndExpectFeatureAccess(
      page,
      "/dashboard/settings/voice-receptionist",
      "Conversation rules"
    );
  });

  test("can add a fourth location on Max (beyond Pro cap)", async ({ page }) => {
    await addLocations(page, ["Branch Two", "Branch Three", "Branch Four"]);
    await expect(page.getByText("Branch Four")).toBeVisible();
    await expect(page.getByRole("button", { name: /Add location/i })).toBeVisible();
  });

  test("shows AI reply generation on Max when a review exists", async ({ page, request }) => {
    const account = makeAccount("plan-max-reviews");
    await registerLoginAndSetPlan(page, request, account, "max");
    await seedReviewByEmail(account.email);
    await page.goto("/dashboard/reviews");
    await expect(page.getByText("E2E Reviewer")).toBeVisible();
    await page.getByRole("button", { name: "Your reply" }).click();
    await expect(page.getByRole("button", { name: "Generate with AI" })).toBeVisible();
  });
});