/**
 * Apply booking-theme migration + seed Wax pilot.
 * Uses pooler DATABASE_URL when DATABASE_URL_DIRECT is unreachable (IPv6).
 */
import { spawnSync } from "node:child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const env = { ...process.env };
// Direct Supabase URLs often resolve to IPv6 — unreachable in some cloud shells.
delete env.DATABASE_URL_DIRECT;

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npm", ["run", "db:migrate"]);
run("npm", ["run", "seed:pilot-wax"]);
console.log("\n✅ Wax ready — open /book/wax-in-the-city (dev server: npm run dev)");
