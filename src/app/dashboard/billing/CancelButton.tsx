"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { dashboardOutlineActionClass } from "@/lib/dashboard-ui";
import { submitResource } from "@/lib/dashboard/use-resource";
import { planDisplayName, type DisplayPlan } from "@/lib/plan-display";

export function CancelButton({ plan }: { plan: DisplayPlan }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const planLabel = planDisplayName(plan);

  async function handleConfirm() {
    const result = await submitResource("/api/billing/cancel", {}, "POST");
    if (!result.ok) {
      toast.danger("Could not cancel subscription", { description: result.error });
      return;
    }
    toast.success(`${planLabel} subscription cancelled`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className={dashboardOutlineActionClass}
      >
        Cancel {planLabel}
      </button>
      <ConfirmDialog
        title={`Cancel ${planLabel}?`}
        description={`You'll keep ${planLabel} features until the current period ends.`}
        confirmLabel="Yes, cancel"
        variant="destructive"
        onConfirm={handleConfirm}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
    </>
  );
}
