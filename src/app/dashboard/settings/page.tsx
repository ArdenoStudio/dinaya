import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsForm from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  const businessId = (session!.user as { businessId: string }).businessId;

  const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);

  return (
    <div>
      <h1 className="font-cal text-2xl mb-6">Settings</h1>
      <SettingsForm business={business} />
    </div>
  );
}
