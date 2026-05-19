import SettingsForm from "@/components/dashboard/SettingsForm";
import { requireBusiness } from "@/lib/auth";

export default async function SettingsPage() {
  const { business } = await requireBusiness();

  return (
    <div>
      <h1 className="font-cal text-2xl mb-6">Settings</h1>
      <SettingsForm business={business} />
    </div>
  );
}
