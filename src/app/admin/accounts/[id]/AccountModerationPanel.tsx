"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  softDeleteAccount,
  suspendAccount,
  unsuspendAccount,
  type ModerationResult,
} from "./actions";

type Props = {
  businessId: string;
  isSuspended: boolean;
  deletedAt: string | null;
};

export function AccountModerationPanel({ businessId, isSuspended, deletedAt }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "suspend" | "unsuspend" | "delete" | null
  >(null);

  const isDeleted = Boolean(deletedAt);

  function runAction(action: "suspend" | "unsuspend" | "delete") {
    setResult(null);
    startTransition(async () => {
      let r: ModerationResult;
      if (action === "suspend") {
        r = await suspendAccount(businessId);
      } else if (action === "unsuspend") {
        r = await unsuspendAccount(businessId);
      } else {
        r = await softDeleteAccount(businessId);
      }
      setResult(r);
      setConfirmAction(null);
    });
  }

  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-950/40 p-5">
      <h2 className="mb-2 text-sm font-semibold text-rose-900 dark:text-rose-200">Danger zone</h2>
      <p className="text-xs text-rose-900 dark:text-rose-200/70">
        Suspend access or soft-delete this account. Deleted accounts keep data but cannot sign in
        or accept bookings.
      </p>

      {isDeleted && (
        <p className="mt-3 rounded-md border border-rose-500/30 bg-white px-3 py-2 text-xs text-rose-900 dark:text-rose-200">
          This account was deleted on{" "}
          {new Date(deletedAt!).toLocaleDateString("en-LK", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          .
        </p>
      )}

      {result && (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-xs ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
              : "border-rose-500/30 bg-white text-rose-900 dark:text-rose-200"
          }`}
        >
          {result.ok ? "Action completed successfully." : result.error}
        </p>
      )}

      {!isDeleted && (
        <div className="mt-4 flex flex-wrap gap-2">
          {isSuspended ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmAction("unsuspend")}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/30 bg-white px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:bg-emerald-950/40 disabled:opacity-50"
            >
              {pending && confirmAction === "unsuspend" && (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              )}
              Unsuspend account
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmAction("suspend")}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-600/30 bg-white px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:bg-amber-950/40 disabled:opacity-50"
            >
              {pending && confirmAction === "suspend" && (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              )}
              Suspend account
            </button>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmAction("delete")}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-600/30 bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {pending && confirmAction === "delete" && (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            )}
            Delete account
          </button>
        </div>
      )}

      {confirmAction && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-white p-3">
          <p className="text-xs text-rose-900 dark:text-rose-200">
            {confirmAction === "suspend" &&
              "Suspend this account? Users won't be able to sign in and the booking page will be unavailable."}
            {confirmAction === "unsuspend" && "Restore access for this account?"}
            {confirmAction === "delete" &&
              "Soft-delete this account? This cannot be undone from the dashboard."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => runAction(confirmAction)}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmAction(null)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
