/**
 * Rebuild e2e/fixtures/personas.json from businesses seeded with e2e-persona- prefix.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { eq, like } from "drizzle-orm";
import { db } from "../src/db";
import { businesses, clients, locations, reviews, services, staff, users } from "../src/db/schema";
import {
  isRichPersonaIndex,
  PERSONA_PASSWORD,
  PERSONA_SLUG_PREFIX,
  type PersonaRecord,
} from "./lib/persona-seed-core";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const FIXTURE_PATH = path.join(process.cwd(), "e2e/fixtures/personas.json");

async function main() {
  const rows = await db
    .select({
      businessId: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      plan: businesses.plan,
      businessType: businesses.businessType,
      language: businesses.language,
      onboardingCompletedAt: businesses.onboardingCompletedAt,
      staffId: staff.id,
      staffName: staff.name,
      serviceId: services.id,
      serviceName: services.name,
      email: users.email,
      userName: users.name,
    })
    .from(businesses)
    .innerJoin(staff, eq(staff.businessId, businesses.id))
    .innerJoin(services, eq(services.businessId, businesses.id))
    .innerJoin(users, eq(users.businessId, businesses.id))
    .where(like(businesses.slug, `${PERSONA_SLUG_PREFIX}%`));

  const locationRows = await db
    .select({ businessId: locations.businessId, id: locations.id })
    .from(locations);
  const locationByBusiness = new Map(locationRows.map((row) => [row.businessId, row.id]));

  const clientRows = await db
    .select({ businessId: clients.businessId, id: clients.id })
    .from(clients);
  const clientByBusiness = new Map(clientRows.map((row) => [row.businessId, row.id]));

  const reviewRows = await db
    .select({ businessId: reviews.businessId, id: reviews.id })
    .from(reviews);
  const reviewByBusiness = new Map(reviewRows.map((row) => [row.businessId, row.id]));

  const personas = rows
    .map((row) => {
      const index = Number.parseInt(row.slug.replace(PERSONA_SLUG_PREFIX, ""), 10);
      if (Number.isNaN(index)) return null;

      const clientId = clientByBusiness.get(row.businessId);
      const reviewId = reviewByBusiness.get(row.businessId);
      const rich =
        isRichPersonaIndex(index) &&
        Boolean(row.onboardingCompletedAt && clientId && reviewId);

      const persona: PersonaRecord = {
        index,
        name: row.userName,
        email: row.email,
        password: PERSONA_PASSWORD,
        businessName: row.name,
        slug: row.slug,
        plan: row.plan as PersonaRecord["plan"],
        businessType: (row.businessType ?? "other") as PersonaRecord["businessType"],
        language: (row.language ?? "en") as PersonaRecord["language"],
        businessId: row.businessId,
        staffId: row.staffId,
        locationId: locationByBusiness.get(row.businessId) ?? "",
        serviceId: row.serviceId,
        serviceName: row.serviceName,
      };

      if (rich && clientId && reviewId) {
        persona.rich = true;
        persona.clientId = clientId;
        persona.reviewId = reviewId;
      }

      return persona;
    })
    .filter((row): row is PersonaRecord => row !== null)
    .sort((a, b) => a.index - b.index);

  fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  fs.writeFileSync(
    FIXTURE_PATH,
    JSON.stringify({ personas, rebuiltAt: new Date().toISOString() }, null, 2),
  );

  const richCount = personas.filter((p) => p.rich).length;
  console.log(`Rebuilt manifest with ${personas.length} personas (${richCount} rich) → ${FIXTURE_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
