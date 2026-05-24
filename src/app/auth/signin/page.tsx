"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";
import { SwapForm } from "@/components/ui/swap-form-base";

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

function getSafeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const passwordReset = searchParams.get("reset") === "1";
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
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

  const banner = (
    <>
      {justRegistered && (
        <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <Icon name="check-circle-fill" className="text-sm mt-0.5 shrink-0" />
          <span>Account created. Sign in to get started.</span>
        </div>
      )}

      {passwordReset && (
        <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <Icon name="check-circle-fill" className="text-sm mt-0.5 shrink-0" />
          <span>Password updated. Sign in with your new password.</span>
        </div>
      )}
    </>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="lg:hidden mb-6 flex justify-center">
        <Logo size="md" />
      </div>

      <SwapForm
        isSignIn
        signUpHref="/register"
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        emailInputRef={emailRef}
        forgotPasswordHref="/forgot-password"
        banner={banner}
        texts={{
          signInTitle: "Welcome back",
          signInSubtitle: "Sign in to your dashboard",
          signInButton: "Sign in",
          footerSignIn: "No account?",
          footerSignInCta: "Create one free",
        }}
      />

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
        <Icon name="lock" />
        <span>Secure sign-in · Your data is encrypted</span>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
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

      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{ background: "#f5f4f1" }}
      >
        <Suspense fallback={<div className="w-xs sm:w-sm h-[420px]" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
