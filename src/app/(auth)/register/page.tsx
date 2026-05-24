"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";

const perks = [
  "Your own booking page at yourname.dinaya.lk",
  "Online payments with PayHere — no no-shows",
  "Staff scheduling & availability management",
  "Free forever for small businesses",
];

const testimonial = {
  quote: "Within a week of signing up, I had clients booking online and I stopped losing appointments to WhatsApp confusion.",
  name: "Ruwani Perera",
  role: "Owner, Glow Beauty Studio · Colombo",
};

const businessTypes = [
  { value: "salon_barber", label: "Salon / barber", helper: "Seeds haircut, colouring, and grooming services." },
  { value: "clinic", label: "Clinic", helper: "Seeds consultation and follow-up appointment types." },
  { value: "tuition", label: "Tuition / classes", helper: "Seeds one-to-one and group class sessions." },
  { value: "vehicle_service", label: "Vehicle service", helper: "Seeds inspection and workshop service slots." },
  { value: "photography", label: "Photography", helper: "Seeds consultation and shoot session services." },
  { value: "spa_wellness", label: "Spa / wellness", helper: "Seeds therapy and treatment appointments." },
  { value: "consulting", label: "Consulting", helper: "Seeds discovery and paid consultation calls." },
  { value: "other", label: "Other", helper: "Seeds a clean generic appointment setup." },
];

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
const strengthText  = ["", "text-red-500", "text-amber-500", "text-emerald-600"];

export default function RegisterPage() {
  const router = useRouter();
  const [referrerCode, setReferrerCode] = useState("");
  const step1Ref   = useRef<HTMLInputElement>(null);
  const step2Ref   = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

  const [step, setStep]               = useState<1 | 2>(1);
  const [form, setForm]               = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    slug: "",
    businessType: "salon_barber",
    language: "en",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  useEffect(() => { step1Ref.current?.focus(); }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReferrerCode(params.get("ref")?.trim().toLowerCase() ?? "");
    const emailFromQuery = params.get("email")?.trim();
    if (emailFromQuery) {
      setForm((f) => ({ ...f, email: emailFromQuery }));
    }
  }, []);
  useEffect(() => { if (step === 2) step2Ref.current?.focus(); }, [step]);

  function handleBusinessNameChange(value: string) {
    setForm((f) => ({ ...f, businessName: value, slug: slugTouched.current ? f.slug : slugify(value) }));
  }
  function handleSlugChange(value: string) {
    slugTouched.current = true;
    setForm((f) => ({ ...f, slug: slugify(value) }));
  }
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setStep(2);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        referrerCode: referrerCode || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return; }

    const signInResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (signInResult?.ok) {
      router.push("/dashboard/setup");
      router.refresh();
      return;
    }

    router.push("/auth/signin?registered=1");
  }

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between px-14 py-12 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #050d1f 0%, #070b18 55%, #09080f 100%)" }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Cobalt Blue glow — top centre (primary brand) */}
        <div
          className="pointer-events-none absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full"
          style={{ background: "rgba(26,110,232,0.18)", filter: "blur(110px)" }}
        />
        {/* Violet glow — top left (engagement) */}
        <div
          className="pointer-events-none absolute -top-40 -left-32 w-96 h-96 rounded-full"
          style={{ background: "rgba(109,40,217,0.14)", filter: "blur(90px)" }}
        />
        {/* Amber glow — bottom right (booking) */}
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 w-72 h-72 rounded-full"
          style={{ background: "rgba(245,158,11,0.09)", filter: "blur(80px)" }}
        />

        <Logo size="lg" className="text-white relative z-10" />

        <div className="relative z-10">
          <p className="font-cal leading-[1.15] text-white mb-3" style={{ fontSize: "2.35rem" }}>
            Your business,<br />
            <span className="text-primary">bookable in minutes.</span>
          </p>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Join salons, clinics, and tutors across Sri Lanka who use Dinaya to fill their calendars — without the back-and-forth.
          </p>

          <ul className="space-y-3 mb-9">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Icon name="check-circle" className="text-sm text-primary shrink-0 mt-0.5" />
                <span className="text-white/65 text-sm">{p}</span>
              </li>
            ))}
          </ul>

          {/* Glass pill testimonial */}
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
            <p className="text-white/25 text-xs">{testimonial.name} · {testimonial.role}</p>
          </div>
        </div>

        <p className="text-white/18 text-xs relative z-10" style={{ color: "rgba(255,255,255,0.18)" }}>
          © {new Date().getFullYear()} Dinaya by Ardeno Studio
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{ background: "#f5f4f1" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo size="md" />
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 justify-center mb-5">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-6 bg-primary" : "w-3 bg-primary/60"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "w-6 bg-primary" : "w-3 bg-gray-300"}`} />
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-2xl px-7 py-8"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)" }}
          >
            {step === 1 ? (
              <>
                <h1 className="font-cal text-2xl mb-1">Create your account</h1>
                <p className="text-muted-foreground text-sm mb-6">Free forever. No credit card needed.</p>

                <form onSubmit={handleStep1} className="space-y-4" noValidate>
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="name">Your name</label>
                    <input ref={step1Ref} id="name" name="name" required autoComplete="name"
                      value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className={inputCls} placeholder="Amara Silva" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" required autoComplete="email" inputMode="email"
                      value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={inputCls} placeholder="you@example.com" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                    <div className="relative mt-1.5">
                      <input id="password" name="password" type={showPassword ? "text" : "password"}
                        required minLength={8} autoComplete="new-password"
                        value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all"
                        placeholder="Min. 8 characters" />
                      <button type="button" onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-500 rounded-md transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>
                        {showPassword ? <Icon name="eye-slash" className="text-sm" /> : <Icon name="eye" className="text-sm" />}
                      </button>
                    </div>
                    {form.password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-gray-100"}`} />
                          ))}
                        </div>
                        <p className={`text-xs mt-1 ${strengthText[strength]}`}>
                          {strengthLabel[strength]}
                          {strength < 3 && (
                            <span className="text-gray-400">
                              {strength === 1 && " — add numbers or symbols"}
                              {strength === 2 && " — add a symbol to strengthen"}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                      <Icon name="exclamation-circle" className="text-sm mt-0.5 shrink-0" /><span>{error}</span>
                    </div>
                  )}

                  <button type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md mt-1">
                    Continue <Icon name="arrow-right" className="text-sm" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setStep(1); setError(""); }}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 -ml-0.5 transition-colors">
                  <Icon name="arrow-left" className="text-xs" /> Back
                </button>

                <h1 className="font-cal text-2xl mb-1">Set up your booking page</h1>
                <p className="text-muted-foreground text-sm mb-6">This is your public page that clients will visit.</p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="businessName">Business name</label>
                    <input ref={step2Ref} id="businessName" name="businessName" required autoComplete="organization"
                      value={form.businessName} onChange={(e) => handleBusinessNameChange(e.target.value)}
                      className={inputCls} placeholder="e.g. Glow Beauty Studio" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="slug">Your booking URL</label>
                    <div className="mt-1.5 flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/40 transition-all">
                      <span className="bg-gray-50 text-gray-300 text-sm px-3 py-2.5 border-r border-gray-200 whitespace-nowrap select-none">
                        dinaya.lk/
                      </span>
                      <input id="slug" name="slug" required value={form.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none placeholder:text-gray-300"
                        placeholder="your-business" />
                    </div>
                    {form.slug && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <Icon name="check-circle" className="text-emerald-500" />
                        Clients will book at <span className="font-medium text-gray-600">dinaya.lk/{form.slug}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="businessType">Business type</label>
                    <select
                      id="businessType"
                      value={form.businessType}
                      onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                      className={inputCls}
                    >
                      {businessTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {businessTypes.find((type) => type.value === form.businessType)?.helper}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="language">Booking page language</label>
                    <select
                      id="language"
                      value={form.language}
                      onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="en">English</option>
                      <option value="si">Sinhala</option>
                      <option value="ta">Tamil</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">
                      You can change this later in Settings.
                    </p>
                  </div>

                  {error && (
                    <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                      <Icon name="exclamation-circle" className="text-sm mt-0.5 shrink-0" /><span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md disabled:cursor-not-allowed mt-1">
                    {loading && <Icon name="arrow-repeat" className="text-sm animate-spin" />}
                    {loading ? "Creating…" : "Create free account"}
                  </button>
                </form>
              </>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
              <Icon name="lock" /><span>Secure sign-up · No credit card required</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
