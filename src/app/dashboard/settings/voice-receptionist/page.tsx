import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { Clock3, PhoneCall } from "lucide-react";
import {
  VOICE_RECEPTIONIST_ROLLOUT,
  isVoiceReceptionistRolloutOpen,
} from "@/lib/voice-receptionist";
import { ProGate } from "@/components/ProGate";
import { VoiceReceptionistClient } from "@/components/dashboard/VoiceReceptionistClient";

export default async function VoiceReceptionistPage() {
  const { businessId } = await requireOwner();
  const rolloutOpen = isVoiceReceptionistRolloutOpen();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings/integrations" className="text-sm text-primary hover:underline">
          ← Integrations
        </Link>
        <h1 className="mt-2 font-cal text-2xl">AI Voice Receptionist</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Phone-agent booking is being prepared for a later Dinaya rollout.
        </p>
      </div>

      {rolloutOpen ? (
        <ProGate businessId={businessId} feature="aiVoiceReceptionist">
          <VoiceReceptionistClient />
        </ProGate>
      ) : (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-blue-200 dark:bg-neutral-900 dark:ring-blue-800">
              <PhoneCall className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-blue-200 dark:bg-neutral-900 dark:ring-blue-800">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {VOICE_RECEPTIONIST_ROLLOUT.statusLabel}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-blue-950 dark:text-blue-100">
                Voice bookings are not live yet
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-950 dark:text-blue-100/80">
                {VOICE_RECEPTIONIST_ROLLOUT.message}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
