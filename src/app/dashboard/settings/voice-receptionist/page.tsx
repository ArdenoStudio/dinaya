import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { ProGate } from "@/components/ProGate";
import { VoiceReceptionistClient } from "@/components/dashboard/VoiceReceptionistClient";

export default async function VoiceReceptionistPage() {
  const { businessId } = await requireOwner();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings/integrations" className="text-sm text-primary hover:underline">
          ← Integrations
        </Link>
        <h1 className="mt-2 font-cal text-2xl">AI Voice Receptionist</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Connect a phone AI provider to Dinaya so callers can ask questions and book appointments.
        </p>
      </div>

      <ProGate businessId={businessId} feature="aiVoiceReceptionist">
        <VoiceReceptionistClient />
      </ProGate>
    </div>
  );
}
