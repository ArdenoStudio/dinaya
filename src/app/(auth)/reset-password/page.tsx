"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";

const inputCls =
  "mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all";

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3;
}

const strengthLabel = ["", "Weak", "Fair", "Strong"];
const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"];
const strengthText = ["", "text-red-500", "text-amber-500", "text-emerald-600"];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not reset password.");
        setLoading(false);
        return;
      }

      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div
          className="bg-white rounded-2xl px-7 py-8"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)" }}
        >
          <h1 className="font-cal text-2xl mb-2">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
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
        <h1 className="font-cal text-2xl mb-1">Choose a new password</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              New password
            </label>
            <div className="relative mt-1.5">
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-500 rounded-md transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <Icon name="eye-slash" className="text-sm" />
                ) : (
                  <Icon name="eye" className="text-sm" />
                )}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        strength >= n ? strengthColor[strength] : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strengthText[strength]}`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
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
            {loading ? "Saving…" : "Reset password"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-400 mt-5">
        <Link href="/login" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#f5f4f1" }}
    >
      <Suspense fallback={<div className="w-full max-w-sm h-[360px]" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
