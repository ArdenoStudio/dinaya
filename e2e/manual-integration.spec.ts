import { test, expect } from "@playwright/test";
import { makeAccount, registerLoginAsStarter, registerLoginAndSetPlan } from "./helpers/auth";

/**
 * API-level integration gates — verifies paid endpoints return 402 without third-party credentials.
 * External flows (PayHere checkout, Google OAuth, Twilio, LLM generation) remain manual; see
 * e2e/MANUAL_INTEGRATION_CHECKLIST.md.
 */
test.describe("Integration API gates by plan", () => {
  test("Starter plan receives 402 from Pro and Max API routes", async ({ page, request }) => {
    const account = makeAccount("api-gates-starter");
    await registerLoginAsStarter(page, request, account);

    const proRoutes = [
      { method: "GET" as const, path: "/api/dashboard/export" },
      {
        method: "POST" as const,
        path: "/api/dashboard/webhooks",
        body: { url: "https://example.com/hook", events: ["booking.created"] },
      },
      { method: "GET" as const, path: "/api/dashboard/webhooks" },
    ];

    for (const route of proRoutes) {
      const res =
        route.method === "GET"
          ? await page.request.get(route.path)
          : await page.request.post(route.path, { data: route.body });
      expect(res.status(), `${route.path} on Starter`).toBe(402);
    }

    const maxRes = await page.request.post("/api/dashboard/ai/content", { data: {} });
    expect(maxRes.status()).toBe(402);
  });

  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required for plan switching");

  test("Pro plan receives 402 from Max-only AI routes", async ({ page, request }) => {
    const account = makeAccount("api-gates-pro");
    await registerLoginAndSetPlan(page, request, account, "pro");

    const maxRes = await page.request.post("/api/dashboard/ai/content", { data: {} });
    expect(maxRes.status()).toBe(402);

    const voiceRes = await page.request.get("/api/dashboard/voice-receptionist");
    expect(voiceRes.status()).toBe(402);
  });

  test("Max plan allows voice receptionist API read", async ({ page, request }) => {
    const account = makeAccount("api-gates-max");
    await registerLoginAndSetPlan(page, request, account, "max");

    const voiceRes = await page.request.get("/api/dashboard/voice-receptionist");
    expect(voiceRes.status()).toBe(200);
  });
});
