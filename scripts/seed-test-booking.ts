/**
 * Full QA seed for the public test booking page (/book/test):
 * branding (logo + hero banner), reviews, services, and availability.
 *
 * Usage:
 *   npx tsx scripts/seed-test-booking.ts
 *   npx tsx scripts/seed-test-booking.ts my-slug
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const slug = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "test";

const scriptsDir = path.join(__dirname);

function run(script: string, extraArgs: string[] = []) {
  const result = spawnSync("npx", ["tsx", path.join(scriptsDir, script), slug, ...extraArgs], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Seeding test booking page for slug "${slug}"...\n`);

run("seed-test-branding.ts");
run("seed-test-reviews.ts", ["--avg", "4.7", "--count", "1500"]);
run("seed-test-services.ts", ["--count", "25"]);
run("seed-test-availability.ts");

console.log("\nAll test booking seeds complete.");
