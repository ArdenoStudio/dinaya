import { Suspense } from "react";
import ImpersonateClient from "./ImpersonateClient";

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm">Loading…</div>}>
      <ImpersonateClient />
    </Suspense>
  );
}
