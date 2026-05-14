import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { Calendar, CreditCard, LayoutDashboard, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Self-booking page",
    desc: "Your own link at yourname.dinaya.lk. Clients book 24/7 without calling you.",
  },
  {
    icon: CreditCard,
    title: "Online payments",
    desc: "Accept deposits or full payment via PayHere. Eliminate no-shows instantly.",
  },
  {
    icon: LayoutDashboard,
    title: "Simple dashboard",
    desc: "See all your bookings in one place. Cancel, reschedule, and track revenue.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Logo size="lg" />
        <div className="flex gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <FadeContainer className="flex flex-col items-center">
          {/* Announcement badge */}
          <FadeDiv className="mb-8">
            <a
              href="/register"
              className="inline-flex items-center gap-3 rounded-full bg-white px-2.5 py-0.5 pr-3 pl-0.5 text-sm font-medium text-gray-900 ring-1 shadow-lg shadow-primary/10 ring-black/10 transition-colors hover:bg-primary/5"
            >
              <span className="shrink-0 rounded-full border bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                New
              </span>
              <span className="flex items-center gap-1 truncate">
                Free for Sri Lankan businesses
                <ArrowUpRight className="size-3.5 shrink-0 text-gray-700" />
              </span>
            </a>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-6">
            <FadeSpan>Your business,</FadeSpan>{" "}
            <FadeSpan>bookable online.</FadeSpan>
            <br />
            <FadeSpan className="text-primary">No WhatsApp chaos.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Give your salon, clinic, or tuition class a free booking page. Clients
              pick a time, pay online, and you get notified. Takes 5 minutes to set up.
            </p>
          </FadeDiv>

          <FadeDiv>
            <Link
              href="/register"
              className="inline-block bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-8 py-3.5 rounded-lg text-base font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.25)] transition-all duration-200 hover:shadow-primary/40 hover:shadow-lg"
            >
              Create your booking page →
            </Link>
          </FadeDiv>

          <FadeDiv>
            <p className="text-sm text-muted-foreground mt-4">Free forever. No credit card needed.</p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 pb-4 pt-0">
        {/* Dashed vertical guide lines */}
        <div className="pointer-events-none absolute inset-0 select-none">
          {[0, 1/3, 2/3, 1].map((pos, i) => (
            <div
              key={i}
              className="absolute inset-y-0 w-px"
              style={{
                left: `${pos * 100}%`,
                maskImage: "linear-gradient(transparent, white 4rem, white calc(100% - 4rem), transparent)",
              }}
            >
              <svg className="h-full w-full" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="0" y2="100%" className="stroke-gray-200" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div className="relative mb-8 text-center">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Everything you need
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="p-6 border rounded-xl bg-white hover:shadow-md transition-shadow">
              <div className="mb-3 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-cal text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-8 py-14 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-pattern" patternUnits="userSpaceOnUse" width="64" height="64">
                  {Array.from({ length: 17 }, (_, i) => {
                    const offset = i * 8;
                    return (
                      <path
                        key={i}
                        d={`M${-106 + offset} 110L${22 + offset} -18`}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  })}
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern)" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <blockquote className="text-xl leading-relaxed tracking-tight text-white md:text-2xl">
              <p>
                <span className="text-white/50 mr-1 text-3xl leading-none align-bottom">&ldquo;</span>
                <strong className="font-semibold">Dinaya completely replaced our WhatsApp booking system.</strong>{" "}
                <span className="text-white/70">
                  Clients love being able to book and pay online. Our no-shows dropped overnight.
                </span>
                <span className="text-white/50 ml-1 text-3xl leading-none align-bottom">&rdquo;</span>
              </p>
            </blockquote>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/30 ring-1 ring-white/20 text-white font-cal text-lg">
                A
              </div>
              <div>
                <div className="text-sm font-medium text-white">Amal Perera</div>
                <div className="text-xs text-white/60">Owner, Amal&apos;s Salon — Colombo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid items-center gap-8 sm:grid-cols-5 rounded-2xl border bg-muted/30 px-8 py-12">
          <div className="sm:col-span-3">
            <h2 className="font-cal text-3xl tracking-tight text-gray-900 md:text-4xl">
              Ready to go bookable?
            </h2>
            <p className="mt-3 mb-8 text-lg text-muted-foreground">
              Set up your booking page in 5 minutes. Free forever for small businesses.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-block bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-6 py-3 rounded-lg font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.25)] transition-all duration-200 hover:shadow-primary/40 hover:shadow-lg"
              >
                Create your page
              </Link>
              <Link
                href="/login"
                className="inline-block px-6 py-3 rounded-lg font-medium border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-center">
            <div className="w-full max-w-xs rounded-xl border bg-white p-5 shadow-lg">
              <div className="space-y-3">
                {["9:00 AM — Haircut · Amal", "10:30 AM — Facial · Nisha", "2:00 PM — Manicure · Priya"].map((s) => (
                  <div key={s} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">Today&apos;s bookings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/legal/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/legal/refund" className="hover:text-foreground">Refund Policy</Link>
        </div>
        <p>© {new Date().getFullYear()} Dinaya by Ardeno Studio</p>
      </footer>
    </main>
  );
}
