import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { loginViaUi, nextBookableDate } from "./helpers/auth";
import type { PersonaRecord } from "../scripts/lib/persona-seed-core";

const FIXTURE_PATH = path.join(process.cwd(), "e2e/fixtures/personas.json");

function loadPersonas(): PersonaRecord[] {
  if (!fs.existsSync(FIXTURE_PATH)) return [];
  const data = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")) as { personas: PersonaRecord[] };
  return data.personas;
}

/** Browser smoke: one seeded persona per plan tier. */
test.describe("Persona smoke — browser", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required");
  test.skip(!fs.existsSync(FIXTURE_PATH), "Run npm run seed:personas first");

  const personas = loadPersonas();
  const byPlan = ["trial", "starter", "pro", "max"].flatMap((plan) => {
    const match = personas.find((p) => p.plan === plan);
    return match ? [match] : [];
  });

  for (const persona of byPlan) {
    test(`${persona.slug} (${persona.plan}) — public booking`, async ({ page }) => {
      await page.goto(`/book/${persona.slug}`);
      await page.getByRole("button", { name: new RegExp(persona.serviceName, "i") }).click();

      const dateStr = nextBookableDate();
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.count()) {
        await dateInput.first().fill(dateStr);
      }

      const slotButton = page
        .locator("button")
        .filter({ hasText: /^\d{1,2}:\d{2}\s*(am|pm)?$/i })
        .first();
      await expect(slotButton).toBeVisible({ timeout: 25_000 });
      await slotButton.click();

      await page.getByLabel(/Full name/i).fill(`Browser ${persona.index}`);
      await page.getByLabel(/Phone number/i).fill(`+9477${String(persona.index).padStart(7, "0").slice(-7)}`);
      await page.getByRole("button", { name: /Confirm booking/i }).click();

      await expect(page.getByText(/Booking confirmed|Booking request received/i)).toBeVisible({
        timeout: 25_000,
      });
    });

    test(`${persona.slug} (${persona.plan}) — owner login`, async ({ page }) => {
      await loginViaUi(page, persona);
      await expect(page.getByRole("heading", { name: /Good day/i })).toBeVisible();
    });
  }
});

test.describe("Persona manifest", () => {
  test.skip(!fs.existsSync(FIXTURE_PATH), "Run npm run seed:personas first");

  test("has at least 800 personas", async () => {
    expect(loadPersonas().length).toBeGreaterThanOrEqual(800);
  });
});
