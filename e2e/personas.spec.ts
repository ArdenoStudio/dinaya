import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { loginViaApi, nextBookableDate } from "./helpers/auth";
import type { PersonaRecord } from "../scripts/lib/persona-seed-core";

const FIXTURE_PATH = path.join(process.cwd(), "e2e/fixtures/personas.json");

const PLANS = ["trial", "starter", "pro", "max"] as const;
const BUSINESS_TYPES = [
  "salon_barber",
  "clinic",
  "tuition",
  "vehicle_service",
  "photography",
  "consulting",
  "spa_wellness",
  "other",
] as const;

function loadPersonas(): PersonaRecord[] {
  if (!fs.existsSync(FIXTURE_PATH)) return [];
  const data = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")) as { personas: PersonaRecord[] };
  return data.personas;
}

/** One persona per plan × business type (32 combinations). */
function gridPersonas(personas: PersonaRecord[]): PersonaRecord[] {
  const picks: PersonaRecord[] = [];
  for (const plan of PLANS) {
    for (const businessType of BUSINESS_TYPES) {
      const match = personas.find((p) => p.plan === plan && p.businessType === businessType);
      if (match) picks.push(match);
    }
  }
  return picks;
}

test.describe("Persona smoke — browser grid", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required");
  test.skip(!fs.existsSync(FIXTURE_PATH), "Run npm run seed:personas first");

  const personas = loadPersonas();
  const grid = gridPersonas(personas);

  test(`manifest covers plan × business type grid (${grid.length} combos)`, async () => {
    expect(grid.length).toBe(PLANS.length * BUSINESS_TYPES.length);
  });

  for (const persona of grid) {
    test(`${persona.slug} (${persona.plan}/${persona.businessType}) — public booking`, async ({ page }) => {
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

    test(`${persona.slug} (${persona.plan}/${persona.businessType}) — owner login`, async ({ page }) => {
      await loginViaApi(page, page.request, persona);
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
