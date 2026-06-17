// One-off: set a business to the "max" plan for testing.
// Usage: node scripts/set-max-plan.mjs "Ardeno Studio"
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";

const name = process.argv[2] || "Ardeno Studio";
const sql = neon(process.env.DATABASE_URL);

// Find matching businesses
const rows = await sql`
  SELECT id, name, slug, plan, plan_expires_at
  FROM businesses
  WHERE LOWER(name) LIKE LOWER(${"%" + name + "%"})
`;

if (!rows.length) {
  console.error(`No business found matching "${name}". Listing all:`);
  const all = await sql`SELECT id, name, slug, plan FROM businesses ORDER BY name`;
  console.table(all);
  process.exit(1);
}

console.log("Matched businesses:");
console.table(rows);

for (const row of rows) {
  await sql`
    UPDATE businesses
    SET plan = 'max', plan_expires_at = NULL
    WHERE id = ${row.id}
  `;
  console.log(`✓ ${row.name} (${row.id}) → plan="max", no expiry`);
}
