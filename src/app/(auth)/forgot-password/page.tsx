"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";

const inputCls =
  "mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all";

function ForgotPasswordForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(
        data.message ??
          "If an account exists for that email, we've sent password reset instructions."
      );
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="lg:hidden mb-6 flex justify-center">
        <Logo size="md" />
      </div>

      <div
        className="bg-white rounded-2xl px-7 py-8"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)" }}
      >
        <h1 className="font-cal text-2xl mb-1">Forgot password?</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <Icon name="check-circle-fill" className="text-sm mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm"
              >
                <Icon name="exclamation-circle" className="text-sm mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md disabled:cursor-not-allowed"
            >
              {loading && <Icon name="arrow-repeat" className="text-sm animate-spin" />}
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>

      {!success && (
        <p className="text-center text-sm text-gray-400 mt-5">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#f5f4f1" }}
    >
      <Suspense fallback={<div className="w-full max-w-sm h-[320px]" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
