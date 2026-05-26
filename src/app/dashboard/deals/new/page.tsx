import { Suspense } from "react";
import { ProGate } from "@/lib/plan";
import { requireOwner } from "@/lib/auth";
import { NewDealForm } from "@/components/dashboard/NewDealForm";

export default async function NewDealPage() {
  const { businessId } = await requireOwner();

  return (
    <ProGate businessId={businessId} feature="deals">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <NewDealForm />
      </Suspense>
    </ProGate>
  );
}
