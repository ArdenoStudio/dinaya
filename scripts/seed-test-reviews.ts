/**
 * Seeds published reviews for a business slug (default: test) so booking pages
 * show a target average rating and review count.
 *
 * Usage:
 *   npx tsx scripts/seed-test-reviews.ts
 *   npx tsx scripts/seed-test-reviews.ts test --avg 4.7 --count 1500
 */
import * as dotenv from "dotenv";
import { and, eq, like } from "drizzle-orm";
import { db } from "../src/db";
import { businesses, reviews } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SAMPLE_COMMENTS = [
  "Great service — will book again.",
  "Professional and on time.",
  "Really happy with the result.",
  "Friendly staff and smooth booking.",
  "Excellent experience overall.",
  "Clean place and good value.",
  "Highly recommend.",
  "Quick and easy appointment.",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const slug = args[0] && !args[0].startsWith("--") ? args[0] : "test";
  let targetAvg = 4.7;
  let targetCount = 1500;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--avg" && args[i + 1]) targetAvg = Number(args[i + 1]);
    if (args[i] === "--count" && args[i + 1]) targetCount = Number(args[i + 1]);
  }

  return { slug, targetAvg, targetCount };
}

/** Build star counts that hit targetAvg (to 1 decimal) at targetCount. */
function buildRatingCounts(targetAvg: number, targetCount: number) {
  const totalStars = Math.round(targetAvg * targetCount);
  const fives = totalStars - 4 * targetCount;
  const fours = targetCount - fives;
  if (fives < 0 || fours < 0) {
    throw new Error(`Cannot reach ${targetAvg} average with ${targetCount} integer ratings`);
  }
  return { fives, fours };
}

async function main() {
  const { slug, targetAvg, targetCount } = parseArgs();

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) {
    console.error(`No business found with slug "${slug}"`);
    process.exit(1);
  }

  const { fives, fours } = buildRatingCounts(targetAvg, targetCount);

  await db
    .delete(reviews)
    .where(and(eq(reviews.businessId, business.id), like(reviews.clientName, "Dinaya Seed #%")));

  const ratings: number[] = [
    ...Array.from({ length: fives }, () => 5),
    ...Array.from({ length: fours }, () => 4),
  ];

  const batchSize = 250;
  let inserted = 0;

  for (let offset = 0; offset < ratings.length; offset += batchSize) {
    const chunk = ratings.slice(offset, offset + batchSize);
    await db.insert(reviews).values(
      chunk.map((rating, index) => {
        const n = offset + index + 1;
        return {
          businessId: business.id,
          clientName: `Dinaya Seed #${n}`,
          rating,
          comment:
            n <= SAMPLE_COMMENTS.length
              ? SAMPLE_COMMENTS[n - 1]
              : n % 7 === 0
                ? SAMPLE_COMMENTS[n % SAMPLE_COMMENTS.length]
                : null,
          isPublished: true,
        };
      }),
    );
    inserted += chunk.length;
    process.stdout.write(`\rInserted ${inserted}/${ratings.length} reviews...`);
  }

  console.log(
    `\nDone — ${business.name} (${business.slug}): ${inserted} reviews seeded (${fives}×5, ${fours}×4 → ~${targetAvg} avg).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
