"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { CheckCircle, Lock } from "lucide-react";

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
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    slug: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleBusinessNameChange(value: string) {
    setForm((f) => ({ ...f, businessName: value, slug: slugify(value) }));
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Nimal Perera"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Business name</label>
                <input
                  required
                  value={form.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className={inputCls}
                  placeholder="Nimal's Salon"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Your booking URL</label>
                <div className="mt-1.5 flex items-center border rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/50">
                  <span className="bg-muted text-muted-foreground text-sm px-3 py-2.5 border-r whitespace-nowrap select-none">
                    dinaya.lk/
                  </span>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none placeholder:text-gray-400"
                    placeholder="nimals-salon"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputCls}
                  placeholder="Min. 8 characters"
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-primary/90 to-primary text-primary-foreground py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.2)] transition-all hover:shadow-primary/30 hover:shadow-md disabled:opacity-50 mt-1"
              >
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
