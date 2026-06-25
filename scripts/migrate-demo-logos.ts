/**
 * Migrate businesses whose logo_url points at /demo/* static files into
 * Supabase Storage (business-logos bucket).
 *
 * Usage:
 *   npx tsx scripts/migrate-demo-logos.ts --dry-run
 *   npx tsx scripts/migrate-demo-logos.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as dotenv from "dotenv";
import { eq, like } from "drizzle-orm";
import { db } from "../src/db";
import { businesses } from "../src/db/schema";
import {
  contentTypeForExtension,
  createBusinessLogosStorage,
  extensionFromPath,
  getSupabaseStorageConfig,
  publicLogoUrl,
} from "../src/lib/supabase-storage";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const config = getSupabaseStorageConfig();

  if (!config && !dryRun) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set both, then re-run.",
    );
    process.exit(1);
  }

  const rows = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      name: businesses.name,
      logoUrl: businesses.logoUrl,
    })
    .from(businesses)
    .where(like(businesses.logoUrl, "/demo/%"));

  if (rows.length === 0) {
    console.log("No businesses with /demo/* logo URLs found.");
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}Found ${rows.length} business(es) to migrate:`);
  const storage = config ? createBusinessLogosStorage(config) : null;

  for (const row of rows) {
    const logoPath = row.logoUrl!;
    const localFile = join(process.cwd(), "public", logoPath.slice(1));

    if (!existsSync(localFile)) {
      console.warn(`  ✗ ${row.slug}: missing file ${localFile} — skipped`);
      continue;
    }

    const ext = extensionFromPath(logoPath);
    const storagePath = `${row.id}/logo.${ext}`;

    if (dryRun) {
      console.log(`  → ${row.slug}: ${logoPath} → ${storagePath}`);
      continue;
    }

    const buffer = readFileSync(localFile);
    const { error } = await storage!.upload(storagePath, buffer, {
      contentType: contentTypeForExtension(ext),
      upsert: true,
    });

    if (error) {
      console.error(`  ✗ ${row.slug}: upload failed — ${error.message}`);
      continue;
    }

    const url = publicLogoUrl(storage!, storagePath);
    await db.update(businesses).set({ logoUrl: url }).where(eq(businesses.id, row.id));
    console.log(`  ✓ ${row.slug}: ${logoPath} → ${url}`);
  }

  if (dryRun) {
    console.log("\nRe-run without --dry-run to upload and update the database.");
  } else {
    console.log("\nDone. After verifying logos in production, public/demo/* assets can be removed from the repo.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
