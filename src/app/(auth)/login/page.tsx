"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

const perks = [
  { icon: Calendar,       text: "Clients book 24/7 without calling you" },
  { icon: CreditCard,     text: "Accept online payments via PayHere" },
  { icon: LayoutDashboard, text: "Manage everything from one dashboard" },
];

const inputCls =
  "mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const emailRef = useRef<HTMLInputElement>(null);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile logo */}
      <div className="lg:hidden mb-6 flex justify-center">
        <Logo size="md" />
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl px-7 py-8"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)" }}
      >
        <h1 className="font-cal text-2xl mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign in to your dashboard</p>

        {justRegistered && (
          <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Account created. Sign in to get started.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
            <input
              ref={emailRef}
              id="email" name="email" type="email" required
              autoComplete="email" inputMode="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputCls} placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-500 rounded-md transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md disabled:cursor-not-allowed mt-1"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-400 mt-5">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between px-14 py-12 overflow-hidden"
        style={{ background: "#06090f" }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Purple glow — top left */}
        <div
          className="pointer-events-none absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full"
          style={{ background: "rgba(109,40,217,0.16)", filter: "blur(100px)" }}
        />
        {/* Amber glow — bottom right */}
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 w-72 h-72 rounded-full"
          style={{ background: "rgba(245,158,11,0.06)", filter: "blur(80px)" }}
        />

        <Logo size="lg" className="text-white relative z-10" />

        <div className="relative z-10">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-6">
            Why businesses choose Dinaya
          </p>
          <ul className="space-y-5">
            {perks.map((p) => (
              <li key={p.text} className="flex items-start gap-4">
                <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: "rgba(109,40,217,0.2)", border: "1px solid rgba(109,40,217,0.25)" }}>
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-white/65 text-sm leading-snug pt-1">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs relative z-10" style={{ color: "rgba(255,255,255,0.18)" }}>
          © {new Date().getFullYear()} Dinaya by Ardeno Studio
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{ background: "#f5f4f1" }}
      >
        <Suspense fallback={<div className="w-full max-w-sm h-[360px]" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
