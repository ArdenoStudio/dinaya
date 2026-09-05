/**
 * One-off check: what's in `businesses` and why /discover might be empty.
 * Usage: npx tsx scripts/check-directory.ts
 */
import * as dotenv from "dotenv";
import { db } from "../src/db";
import { businesses } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const rows = await db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      directoryListed: businesses.directoryListed,
      isSuspended: businesses.isSuspended,
      deletedAt: businesses.deletedAt,
      directoryCategory: businesses.directoryCategory,
      directoryCity: businesses.directoryCity,
    })
    .from(businesses);

  console.log(`Total businesses: ${rows.length}`);
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
