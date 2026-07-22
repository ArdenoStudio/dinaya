import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { Clock3, PhoneCall } from "lucide-react";
import {
  VOICE_RECEPTIONIST_ROLLOUT,
  isVoiceReceptionistRolloutOpen,
} from "@/lib/voice-receptionist";
import { ProGate } from "@/components/ProGate";
import { VoiceReceptionistClient } from "@/components/dashboard/VoiceReceptionistClient";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  dashboardPageClass,
  dashboardSurfaceClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

export default async function VoiceReceptionistPage() {
  const { businessId } = await requireOwner();
  const rolloutOpen = isVoiceReceptionistRolloutOpen();

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="AI Voice Receptionist"
        description="Phone-agent booking is being prepared for a later Dinaya rollout."
        backHref="/dashboard/settings/integrations"
        backLabel="Integrations"
      />

      {rolloutOpen ? (
        <ProGate businessId={businessId} feature="aiVoiceReceptionist">
          <VoiceReceptionistClient />
        </ProGate>
      ) : (
        <section className={cn(dashboardSurfaceClass, "p-6")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PhoneCall className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {VOICE_RECEPTIONIST_ROLLOUT.statusLabel}
              </div>
              <h2 className="mt-3 font-cal text-lg tracking-tight">
                Voice bookings are not live yet
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {VOICE_RECEPTIONIST_ROLLOUT.message}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
