/**
 * Marks a business onboarding complete so docs live-capture can screenshot
 * the full dashboard shell (not the setup wizard).
 *
 * Usage: npx tsx scripts/docs-complete-onboarding.ts user@email.test
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { businesses, users } from "../src/db/schema";

// This script cold-starts a brand-new DB connection (unlike the long-running
// dev server's warm pool), which made it disproportionately likely to catch
// a transient connection blip during capture runs. Retry before giving up.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 2000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        console.warn(`DB attempt ${i + 1}/${attempts} failed, retrying in ${delayMs}ms…`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/docs-complete-onboarding.ts <email>");
    process.exit(1);
  }

  const [user] = await withRetry(() =>
    db
      .select({ businessId: users.businessId })
      .from(users)
      .where(eq(users.email, email))
      .limit(1),
  );

  if (!user?.businessId) {
    console.error(`No business found for ${email}`);
    process.exit(1);
  }

  await withRetry(() =>
    db
      .update(businesses)
      .set({
        onboardingCompletedAt: new Date(),
        onboardingStep: 4,
        phone: "+94771234567",
        address: "42 Galle Road, Colombo 03",
        description: "Haircuts, colour, and bridal styling in Colombo.",
        // Unlocks the clean Today overview (no setup checklist / localhost link).
        payhereEnabled: true,
        payhereMerchantId: "docs-demo-merchant",
      })
      .where(eq(businesses.id, user.businessId)),
  );

  console.log(`Onboarding completed for ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
