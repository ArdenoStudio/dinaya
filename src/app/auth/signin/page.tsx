"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import {
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-form-styles";
import { Icon } from "@/components/ui/Icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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
  const reduceMotion = useReducedMotion();
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

  const containerVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.12 },
        },
      };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 300, damping: 24 },
        },
      };

  async function handleSignIn() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSignIn();
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[420px]"
    >
      <motion.div variants={itemVariants} className="mb-6 text-center lg:text-left">
        <h1 className="mb-1 text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to your Dinaya dashboard</p>
      </motion.div>

      {justRegistered && (
        <motion.div
          variants={itemVariants}
          className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <Icon name="check-circle-fill" className="mt-0.5 shrink-0 text-sm" />
          <span>Account created. Sign in to get started.</span>
        </motion.div>
      )}

      {passwordReset && (
        <motion.div
          variants={itemVariants}
          className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <Icon name="check-circle-fill" className="mt-0.5 shrink-0 text-sm" />
          <span>Password updated. Sign in with your new password.</span>
        </motion.div>
      )}

      <form
        onSubmit={handleSubmit}
        action="#"
        method="post"
        className="flex flex-col gap-4"
        noValidate
      >
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <label htmlFor="email" className={authLabelClassName}>
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
            className={authInputClassName}
            placeholder="you@example.com"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className={authLabelClassName}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClassName} pr-12`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              <Icon name={showPassword ? "eye-slash" : "eye"} className="text-sm" />
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            <Icon name="exclamation-circle" className="mt-0.5 shrink-0 text-sm" />
            <span>{error}</span>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSignIn()}
            className={authPrimaryButtonClassName}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading && <Icon name="arrow-repeat" className="animate-spin text-sm" />}
              {loading ? "Signing in…" : "Sign in"}
            </span>
          </button>
        </motion.div>
      </form>

      <motion.div
        variants={itemVariants}
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start"
      >
        <Icon name="lock" className="text-xs" />
        <span>Secure sign-in · Your data is encrypted</span>
      </motion.div>

      <motion.p variants={itemVariants} className="mt-5 text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-semibold text-foreground hover:underline">
          Create your booking page
        </Link>
      </motion.p>
    </motion.div>
  );
}

export default function SignInPage() {
  return (
    <AuthSplitShell>
      <Suspense fallback={<div className="h-[420px] w-full max-w-[420px]" aria-hidden />}>
        <LoginForm />
      </Suspense>
    </AuthSplitShell>
  );
}
