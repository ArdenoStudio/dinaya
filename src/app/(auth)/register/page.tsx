"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react";

const perks = [
  "Your own booking page at yourname.dinaya.lk",
  "Online payments with PayHere — no no-shows",
  "Staff scheduling & availability management",
  "Free forever for small businesses",
];

const inputCls =
  "mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-gray-400";

export default function RegisterPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    slug: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleBusinessNameChange(value: string) {
    setForm((f) => ({
      ...f,
      businessName: value,
      slug: slugTouched.current ? f.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    slugTouched.current = true;
    setForm((f) => ({ ...f, slug: slugify(value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 flex-col justify-between px-14 py-12">
        <Logo size="lg" className="text-white" />
        <div>
          <p className="font-cal text-3xl text-white mb-2">
            Your business,<br />
            <span className="text-primary">bookable in minutes.</span>
          </p>
          <p className="text-white/50 text-sm mb-8">
            Join salons, clinics, and tutors across Sri Lanka who use Dinaya.
          </p>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <p className="text-white/80 text-sm">{p}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} Dinaya by Ardeno Studio</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo size="md" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border shadow-sm px-7 py-8">
            <h1 className="font-cal text-2xl mb-1">Create your booking page</h1>
            <p className="text-muted-foreground text-sm mb-6">Free forever. No credit card needed.</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="text-sm font-medium" htmlFor="name">Your name</label>
                <input
                  ref={nameRef}
                  id="name"
                  name="name"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Nimal Perera"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="businessName">Business name</label>
                <input
                  id="businessName"
                  name="businessName"
                  required
                  autoComplete="organization"
                  value={form.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className={inputCls}
                  placeholder="Nimal's Salon"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="slug">Your booking URL</label>
                <div className="mt-1.5 flex items-center border rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/50">
                  <span className="bg-muted text-muted-foreground text-sm px-3 py-2.5 border-r whitespace-nowrap select-none">
                    dinaya.lk/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    required
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none placeholder:text-gray-400"
                    placeholder="nimals-salon"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full border rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-gray-400"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md disabled:cursor-not-allowed mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating…" : "Create free account"}
              </button>
            </form>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Secure sign-up · No credit card required</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
