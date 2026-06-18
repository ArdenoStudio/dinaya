"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { Icon } from "@/components/ui/Icon";

const perks = [
  { icon: "calendar", text: "Clients book 24/7 without calling you" },
  { icon: "credit-card", text: "Accept online payments via PayHere" },
  { icon: "grid", text: "Manage everything from one dashboard" },
];

const testimonial = {
  quote:
    "I used to miss bookings because of WhatsApp messages I forgot to reply to. Now everything's in Dinaya and I haven't missed one since.",
  name: "Kavinda Jayasuriya",
  role: "Owner, The Barber Room · Kandy",
};

const inputCls =
  "mt-1.5 w-full border border-gray-200 dark:border-neutral-800 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 dark:placeholder:text-neutral-600 transition-all";

function getSafeCallbackUrl(raw: string | null, justRegistered: boolean): string {
  if (justRegistered) return "/dashboard/setup";
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

async function credentialsSignIn(input: {
  callbackUrl: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const csrfRes = await fetch("/api/auth/csrf", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!csrfRes.ok) {
    throw new Error("Could not start sign-in.");
  }

  const csrfData = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfData.csrfToken) {
    throw new Error("Missing sign-in token.");
  }

  const body = new URLSearchParams({
    callbackUrl: input.callbackUrl,
    csrfToken: csrfData.csrfToken,
    email: input.email,
    json: "true",
    password: input.password,
  });

  const res = await fetch("/api/auth/callback/credentials", {
    body,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    method: "POST",
    redirect: "manual",
  });

  if (res.type === "opaqueredirect") {
    return { ok: true };
  }

  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text) as { error?: string; url?: string };
        } catch {
          return { error: "AuthResponseNotJson" };
        }
      })()
    : {};
  const url = typeof data.url === "string" ? data.url : "";

  if (!res.ok || url.includes("error=CredentialsSignin")) {
    return { ok: false, error: "CredentialsSignin" };
  }

  if (data.error) {
    return { ok: false, error: data.error };
  }

  if (url.includes("error=")) {
    return { ok: false, error: "AuthError" };
  }

  return { ok: true };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const passwordReset = searchParams.get("reset") === "1";
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), justRegistered);

  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await credentialsSignIn({
        callbackUrl,
        email,
        password,
      });

      if (!result.ok) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
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
        className="bg-white dark:bg-neutral-900 rounded-2xl px-7 py-8"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)" }}
      >
        <h1 className="font-cal text-2xl mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign in to your dashboard</p>

        {justRegistered && (
          <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 text-sm">
            <Icon name="check-circle-fill" className="text-sm mt-0.5 shrink-0" />
            <span>Account created. Sign in to get started.</span>
          </div>
        )}

        {passwordReset && (
          <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 text-sm">
            <Icon name="check-circle-fill" className="text-sm mt-0.5 shrink-0" />
            <span>Password updated. Sign in with your new password.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
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

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 dark:border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 dark:placeholder:text-neutral-600 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-500 dark:text-gray-400 rounded-md transition-colors"
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
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md disabled:cursor-not-allowed mt-1"
          >
            {loading && <Icon name="arrow-repeat" className="text-sm animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
          <Icon name="lock" />
          <span>Secure sign-in · Your data is encrypted</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-5">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      <AuthThemeToggle />
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between px-14 py-12 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #050d1f 0%, #070b18 55%, #09080f 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full"
          style={{ background: "rgba(26,110,232,0.18)", filter: "blur(110px)" }}
        />
        <div
          className="pointer-events-none absolute -top-40 -left-32 w-96 h-96 rounded-full"
          style={{ background: "rgba(109,40,217,0.14)", filter: "blur(90px)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 w-72 h-72 rounded-full"
          style={{ background: "rgba(245,158,11,0.09)", filter: "blur(80px)" }}
        />

        <Logo size="lg" className="text-white relative z-10" />

        <div className="relative z-10">
          <p className="font-cal leading-[1.15] text-white mb-3" style={{ fontSize: "2.35rem" }}>
            Your calendar,
            <br />
            <span className="text-primary">always full.</span>
          </p>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Thousands of appointments managed. Zero phone calls needed.
          </p>

          <ul className="space-y-3 mb-9">
            {perks.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <Icon name={p.icon} className="text-sm text-primary shrink-0 mt-0.5" />
                <span className="text-white/65 text-sm">{p.text}</span>
              </li>
            ))}
          </ul>

          <div
            className="rounded-2xl px-4 py-3.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <p className="text-white/50 text-xs italic leading-relaxed mb-2">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <p className="text-white/25 text-xs">
              {testimonial.name} · {testimonial.role}
            </p>
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: "rgba(255,255,255,0.18)" }}>
          © {new Date().getFullYear()} Dinaya by Ardeno Studio
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#f5f4f1] dark:bg-neutral-950">
        <Suspense fallback={<div className="w-full max-w-sm h-[360px]" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
