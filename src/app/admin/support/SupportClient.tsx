"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { resetUserPassword, type ResetPasswordResult } from "./actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "staff";
  businessName: string;
};

export function SupportClient({ users }: { users: UserRow[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ResetPasswordResult | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleReset(userId: string) {
    setResult(null);
    setConfirmId(null);
    startTransition(async () => {
      const r = await resetUserPassword(userId);
      setResult(r);
    });
  }

  async function copyPassword() {
    if (!result?.ok) return;
    await navigator.clipboard.writeText(result.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {result && (
        <div
          className={
            result.ok
              ? "rounded-xl border border-emerald-500/30 bg-emerald-50 p-4"
              : "rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-rose-900"
          }
        >
          {result.ok ? (
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Password reset for {result.email}
              </p>
              <p className="mt-1 text-xs text-emerald-900/80">
                Share this one-time password with the user. They&apos;ll need to change it after
                signing in. This will only be shown once.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 select-all rounded-md border border-emerald-500/30 bg-white px-3 py-2 font-mono text-base font-bold tracking-wider text-emerald-900">
                  {result.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" aria-hidden="true" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" aria-hidden="true" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{result.error}</p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No users match your search.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.businessName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.role === "owner"
                          ? "rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmId === u.id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleReset(u.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          {pending ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Resetting…
                            </>
                          ) : (
                            <>
                              <KeyRound className="size-3.5" aria-hidden="true" /> Confirm reset
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setResult(null);
                          setConfirmId(u.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <KeyRound className="size-3.5" aria-hidden="true" /> Reset password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
