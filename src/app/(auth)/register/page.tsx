"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { slugify } from "@/lib/utils";
import { trackSignup } from "@/lib/analytics/gtag";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import {
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-form-styles";
import { Icon } from "@/components/ui/Icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const businessTypes = [
  { value: "salon_barber", label: "Salon / barber", helper: "Starts with haircut, colour, and grooming services." },
  { value: "clinic", label: "Clinic", helper: "Starts with consultation and follow-up visits." },
  { value: "tuition", label: "Tuition / classes", helper: "Starts with one-to-one and group class sessions." },
  { value: "vehicle_service", label: "Vehicle service", helper: "Starts with inspection and workshop bookings." },
  { value: "photography", label: "Photography", helper: "Starts with consultation and portrait sessions." },
  { value: "spa_wellness", label: "Spa / wellness", helper: "Starts with massage and treatment appointments." },
  { value: "consulting", label: "Consulting", helper: "Starts with discovery and paid consultation calls." },
  { value: "other", label: "Other", helper: "Starts with a simple consultation and appointment setup." },
];

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

export default function RegisterPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [referrerCode, setReferrerCode] = useState("");
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });
  const step1Ref = useRef<HTMLInputElement>(null);
  const step2Ref = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    slug: "",
    businessType: "salon_barber",
    language: "en",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    step1Ref.current?.focus();
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReferrerCode(params.get("ref")?.trim().toLowerCase() ?? "");
    setUtm({
      source: params.get("utm_source")?.trim().slice(0, 80) ?? "",
      medium: params.get("utm_medium")?.trim().slice(0, 80) ?? "",
      campaign: params.get("utm_campaign")?.trim().slice(0, 120) ?? "",
    });
    const emailFromQuery = params.get("email")?.trim();
    if (emailFromQuery) {
      setForm((f) => ({ ...f, email: emailFromQuery }));
    }
  }, []);
  useEffect(() => {
    if (step === 2) step2Ref.current?.focus();
  }, [step]);

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

  function handleBusinessNameChange(value: string) {
    setForm((f) => ({ ...f, businessName: value, slug: slugTouched.current ? f.slug : slugify(value) }));
  }
  function handleSlugChange(value: string) {
    slugTouched.current = true;
    setForm((f) => ({ ...f, slug: slugify(value) }));
  }
  function handleStep1Continue() {
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
  }
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    handleStep1Continue();
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          referrerCode: referrerCode || undefined,
          utmSource: utm.source || undefined,
          utmMedium: utm.medium || undefined,
          utmCampaign: utm.campaign || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      trackSignup({ businessType: form.businessType, language: form.language });

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: `${window.location.origin}/dashboard/setup`,
      });

      if (signInResult?.ok) {
        router.push("/dashboard/setup");
        router.refresh();
        return;
      }

      router.push("/auth/signin?registered=1");
    } catch {
      setError("Something went wrong. Please try signing in.");
      setLoading(false);
    }
  }

  const strength = getPasswordStrength(form.password);

  return (
    <AuthSplitShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[420px]"
      >
        <motion.div variants={itemVariants} className="mb-6 text-center lg:text-left">
          <h1 className="mb-1 font-cal text-3xl tracking-tight text-foreground md:text-4xl">
            {step === 1 ? "Create your account" : "Set up your booking page"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Start your 14-day free trial. No credit card needed."
              : "This is your public page that clients will visit."}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6 flex items-center gap-1.5 justify-center lg:justify-start">
          <div
            className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${step === 1 ? "w-6 bg-primary" : "w-3 bg-primary/60"}`}
          />
          <div
            className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${step === 2 ? "w-6 bg-primary" : "w-3 bg-border"}`}
          />
        </motion.div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="flex flex-col gap-4" noValidate>
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="name" className={authLabelClassName}>
                Your name
              </label>
              <input
                ref={step1Ref}
                id="name"
                name="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={authInputClassName}
                placeholder="Amara Silva"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="email" className={authLabelClassName}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={authInputClassName}
                placeholder="you@example.com"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="password" className={authLabelClassName}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={`${authInputClassName} pr-12`}
                  placeholder="Min. 8 characters"
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
              {form.password.length > 0 && (
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-[width,background-color] duration-300 ${i <= strength ? strengthColor[strength] : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${strengthText[strength]}`}>
                    {strengthLabel[strength]}
                    {strength < 3 && (
                      <span className="text-muted-foreground">
                        {strength === 1 && " — add numbers or symbols"}
                        {strength === 2 && " — add a symbol to strengthen"}
                      </span>
                    )}
                  </p>
                </div>
              )}
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
              <button type="submit" className={authPrimaryButtonClassName}>
                <span className="inline-flex items-center justify-center gap-2">
                  Continue <Icon name="arrow-right" className="text-sm" />
                </span>
              </button>
            </motion.div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <motion.button
              variants={itemVariants}
              type="button"
              onClick={() => {
                setStep(1);
                setError("");
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-1 -ml-0.5"
            >
              <Icon name="arrow-left" className="text-xs" /> Back
            </motion.button>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="businessName" className={authLabelClassName}>
                Business name
              </label>
              <input
                ref={step2Ref}
                id="businessName"
                name="businessName"
                required
                autoComplete="organization"
                value={form.businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                className={authInputClassName}
                placeholder="e.g. Glow Beauty Studio"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="slug" className={authLabelClassName}>
                Your booking URL
              </label>
              <div className="flex items-center overflow-hidden rounded-full border border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                <input
                  id="slug"
                  name="slug"
                  required
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 bg-transparent px-5 py-3 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60"
                  placeholder="your-business"
                />
                <span className="whitespace-nowrap border-l border-border px-4 py-3 text-sm text-muted-foreground select-none">
                  .dinaya.lk
                </span>
              </div>
              {form.slug && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="check-circle" className="text-emerald-500" />
                  Clients will book at <span className="font-medium text-foreground">{form.slug}.dinaya.lk</span>
                </p>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="businessType" className={authLabelClassName}>
                Business type
              </label>
              <select
                id="businessType"
                value={form.businessType}
                onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                className={authInputClassName}
              >
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {businessTypes.find((type) => type.value === form.businessType)?.helper}
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label htmlFor="language" className={authLabelClassName}>
                Booking page language
              </label>
              <select
                id="language"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                className={authInputClassName}
              >
                <option value="en">English</option>
                <option value="si">Sinhala</option>
                <option value="ta">Tamil</option>
              </select>
              <p className="text-xs text-muted-foreground">You can change this later in Settings.</p>
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
              <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
                <span className="inline-flex items-center justify-center gap-2">
                  {loading && <Icon name="arrow-repeat" className="animate-spin text-sm" />}
                  {loading ? "Creating…" : MARKETING_CTA_PRIMARY}
                </span>
              </button>
            </motion.div>
          </form>
        )}

        <motion.div
          variants={itemVariants}
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start"
        >
          <Icon name="lock" className="text-xs" />
          <span>Secure sign-up · No credit card required</span>
        </motion.div>

        <motion.p variants={itemVariants} className="mt-5 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </AuthSplitShell>
  );
}
