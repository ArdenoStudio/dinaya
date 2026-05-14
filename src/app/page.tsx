import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import {
  Calendar, CreditCard, LayoutDashboard, ArrowUpRight,
  Bell, Clock, Link2, Star, CheckCircle2, Zap, ArrowRight,
  ChevronDown, Scissors, Stethoscope, GraduationCap, Briefcase,
  BookOpen, HelpCircle, FileText, Sparkles,
} from "lucide-react";

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
  {
    icon: Bell,
    title: "Automated reminders",
    desc: "Clients get SMS and email reminders before their appointment — automatically.",
  },
  {
    icon: Clock,
    title: "Custom availability",
    desc: "Set your working hours, block dates, and add buffer time between sessions.",
  },
  {
    icon: Link2,
    title: "Shareable link",
    desc: "One link for Instagram, WhatsApp, and Facebook. Share everywhere in seconds.",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your page",
    desc: "Add your services, prices, and availability. Takes less than 5 minutes.",
  },
  {
    number: "02",
    title: "Share your link",
    desc: "Send your dinaya.lk/yourname link via WhatsApp, Instagram, or Facebook.",
  },
  {
    number: "03",
    title: "Get booked",
    desc: "Clients pick a time, pay online. You get an instant notification.",
  },
];

const testimonials = [
  {
    quote: "Dinaya completely replaced our WhatsApp booking system. Clients love being able to book and pay online. Our no-shows dropped overnight.",
    name: "Amal Perera",
    role: "Owner, Amal's Salon",
    location: "Colombo",
    initial: "A",
  },
  {
    quote: "I never thought managing appointments could be this simple. My patients book online and pay a deposit instantly — no more phone tag.",
    name: "Dr. Nisha Fernando",
    role: "NF Dental Clinic",
    location: "Kandy",
    initial: "N",
  },
  {
    quote: "My tuition class fills up without me managing WhatsApp groups. Parents just click the link and book their child's slot.",
    name: "Priya Wickramasinghe",
    role: "Piano Teacher",
    location: "Nugegoda",
    initial: "P",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Announcement bar */}
      <div className="bg-gray-950 py-2.5 px-4 text-center">
        <p className="text-xs text-white/80">
          <span className="text-primary font-semibold">Now live:</span>{" "}
          PayHere integration — accept deposits and full payments from clients.{" "}
          <Link href="/register" className="text-white underline underline-offset-2 font-medium">
            Start free →
          </Link>
        </p>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Logo size="lg" />

          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700">
            {/* Features dropdown */}
            <div className="relative group">
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
                Features
                <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-0 top-full pt-2 w-72">
                <div className="rounded-xl border bg-white shadow-lg shadow-gray-900/5 p-2">
                  {[
                    { icon: Calendar, title: "Self-booking page", desc: "Your own 24/7 booking link" },
                    { icon: CreditCard, title: "Online payments", desc: "Accept deposits via PayHere" },
                    { icon: Bell, title: "Automated reminders", desc: "SMS & email, on autopilot" },
                    { icon: LayoutDashboard, title: "Simple dashboard", desc: "Manage every booking in one place" },
                  ].map((it) => (
                    <Link
                      key={it.title}
                      href="#features"
                      className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <it.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{it.title}</span>
                        <span className="block text-xs text-muted-foreground">{it.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Solutions dropdown */}
            <div className="relative group">
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
                Solutions
                <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-0 top-full pt-2 w-64">
                <div className="rounded-xl border bg-white shadow-lg shadow-gray-900/5 p-2">
                  {[
                    { icon: Scissors, title: "Salons & spas", desc: "Stylists, beauty, wellness" },
                    { icon: Stethoscope, title: "Clinics", desc: "Dental, physio, doctors" },
                    { icon: GraduationCap, title: "Tuition classes", desc: "Tutors and instructors" },
                    { icon: Briefcase, title: "Freelancers", desc: "Consultants & coaches" },
                  ].map((it) => (
                    <Link
                      key={it.title}
                      href="/register"
                      className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <it.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{it.title}</span>
                        <span className="block text-xs text-muted-foreground">{it.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Resources dropdown */}
            <div className="relative group">
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
                Resources
                <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-0 top-full pt-2 w-64">
                <div className="rounded-xl border bg-white shadow-lg shadow-gray-900/5 p-2">
                  {[
                    { icon: BookOpen, title: "Getting started", desc: "Set up in 5 minutes" },
                    { icon: HelpCircle, title: "Help center", desc: "Answers to common questions" },
                    { icon: Sparkles, title: "What's new", desc: "Latest features and updates" },
                    { icon: FileText, title: "Legal", desc: "Terms, privacy, refunds", href: "/legal/terms" },
                  ].map((it) => (
                    <Link
                      key={it.title}
                      href={it.href ?? "#"}
                      className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <it.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{it.title}</span>
                        <span className="block text-xs text-muted-foreground">{it.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="#pricing"
              className="px-3 py-2 rounded-md hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex gap-4 items-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <FadeContainer className="flex flex-col items-center">
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

      {/* Trust strip */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
          <span>Trusted by salons, clinics, tuition classes, and freelancers across Sri Lanka</span>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 py-20 border-t">
        <div className="pointer-events-none absolute inset-0 select-none">
          {[0, 1 / 3, 2 / 3, 1].map((pos, i) => (
            <div
              key={i}
              className="absolute inset-y-0 w-px"
              style={{
                left: `${pos * 100}%`,
                maskImage:
                  "linear-gradient(transparent, white 4rem, white calc(100% - 4rem), transparent)",
              }}
            >
              <svg className="h-full w-full" preserveAspectRatio="none">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                  className="stroke-gray-200"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          ))}
        </div>

        <div className="relative text-center mb-14">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Everything you need
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            Everything to replace WhatsApp booking
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Six tools that work together — so you stop chasing clients and start filling your calendar.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70 shadow-sm">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-7 bg-white hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-white transition-colors"
            >
              <span className="absolute top-5 right-5 text-[10px] font-mono font-medium text-gray-300 tracking-wider">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="relative mb-5 inline-flex">
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 group-hover:ring-primary/25 transition">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
              </div>

              <h3 className="font-cal text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>

              <span className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16 border-t">
        <div className="text-center mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            How it works
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col">
              <div className="mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15">
                  <span className="font-cal text-2xl text-primary">{step.number}</span>
                </div>
              </div>
              <h3 className="font-cal text-xl mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t">
        <div className="text-center mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Loved by businesses
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            What our users say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl border bg-white hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-gray-700 flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-cal text-base shrink-0">
                  {t.initial}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role} · {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-8 py-20 text-center shadow-2xl shadow-indigo-500/20">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cta-pattern" patternUnits="userSpaceOnUse" width="64" height="64">
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
                <rect width="100%" height="100%" fill="url(#cta-pattern)" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-white/80 mb-6">
                <Zap className="size-3.5" />
                Free forever · No credit card needed
              </div>
              <h2 className="font-cal text-4xl md:text-5xl tracking-tight text-white mb-4">
                Ready to go bookable?
              </h2>
              <p className="text-lg text-white/70 mb-10 max-w-md mx-auto">
                Set up your booking page in 5 minutes. Start accepting clients today.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
                >
                  Create your page
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Logo size="lg" />
              <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Online booking for Sri Lankan businesses. No WhatsApp chaos, no setup fees,
                no commissions.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    Get started
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/refund" className="hover:text-foreground transition-colors">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Dinaya by Ardeno Studio
            </p>
            <p className="text-xs text-muted-foreground">Made with ❤️ for Sri Lankan businesses</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
