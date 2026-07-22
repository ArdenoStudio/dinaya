/**
 * Marks a business onboarding complete so docs live-capture can screenshot
 * the full dashboard shell (not the setup wizard).
 *
 * Usage: npx tsx scripts/docs-complete-onboarding.ts user@email.test
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { businesses, users } from "../src/db/schema";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/docs-complete-onboarding.ts <email>");
    process.exit(1);
  }

  const [user] = await db
    .select({ businessId: users.businessId })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user?.businessId) {
    console.error(`No business found for ${email}`);
    process.exit(1);
  }

  await db
    .update(businesses)
    .set({
      onboardingCompletedAt: new Date(),
      onboardingStep: 4,
      phone: "+94771234567",
      address: "42 Galle Road, Colombo 03",
      description: "Haircuts, colour, and bridal styling in Colombo.",
    })
    .where(eq(businesses.id, user.businessId));

  console.log(`Onboarding completed for ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
