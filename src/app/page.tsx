import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { LandingNav } from "@/components/LandingNav";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { WordRotate } from "@/components/WordRotate";
import ProductMockup from "@/components/ProductMockup";
import { CTAPrimaryButton } from "@/components/cta-primary-button";

const features = [
  {
    icon: "bi-calendar-check",
    title: "Self-booking page",
    desc: "Your own link at yourname.dinaya.lk. Clients book 24/7 without calling you.",
  },
  {
    icon: "bi-credit-card",
    title: "Online payments",
    desc: "Accept deposits or full payment via PayHere. Eliminate no-shows instantly.",
  },
  {
    icon: "bi-grid",
    title: "Simple dashboard",
    desc: "See all your bookings in one place. Cancel, reschedule, and track revenue.",
  },
  {
    icon: "bi-bell",
    title: "Automated reminders",
    desc: "Clients get SMS and email reminders before their appointment — automatically.",
  },
  {
    icon: "bi-clock",
    title: "Custom availability",
    desc: "Set your working hours, block dates, and add buffer time between sessions.",
  },
  {
    icon: "bi-share",
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
    color: "bg-blue-100 text-blue-700",
  },
  {
    quote: "I never thought managing appointments could be this simple. My patients book online and pay a deposit instantly — no more phone tag.",
    name: "Dr. Nisha Fernando",
    role: "NF Dental Clinic",
    location: "Kandy",
    initial: "N",
    color: "bg-violet-100 text-violet-700",
  },
  {
    quote: "My tuition class fills up without me managing WhatsApp groups. Parents just click the link and book their child's slot.",
    name: "Priya Wickramasinghe",
    role: "Piano Teacher",
    location: "Nugegoda",
    initial: "P",
    color: "bg-amber-100 text-amber-700",
  },
];


export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-white">
      {/* Announcement bar — fix #10: changed from PayHere (already in features) to SMS reminders */}
      <div className="bg-gray-950 py-2.5 px-4 text-center">
        <p className="text-xs text-white/80">
          <span className="text-primary font-semibold">New:</span>{" "}
          SMS & email reminders — your clients get notified automatically before every appointment.{" "}
          <Link href="/register" className="text-white underline underline-offset-2 font-medium">
            Start free →
          </Link>
        </p>
      </div>

      {/* Nav — fix #5 (mobile menu) + fix #6 (dead resource links) via LandingNav */}
      <LandingNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-12 text-center">
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
                <i className="bi bi-arrow-up-right text-xs shrink-0 text-gray-700" />
              </span>
            </a>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-6 text-balance">
            <FadeSpan>Your business,</FadeSpan>{" "}
            <FadeSpan>bookable online.</FadeSpan>
            <br />
            <FadeSpan className="text-primary">
              No{" "}
              <WordRotate
                words={[
                  "WhatsApp chaos.",
                  "missed bookings.",
                  "back-and-forth.",
                  "double bookings.",
                  "manual reminders.",
                ]}
                className="text-primary"
              />
            </FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
              Give your salon, clinic, or tuition class a free booking page. Clients
              pick a time, pay online, and you get notified. Takes 5 minutes to set up.
            </p>
          </FadeDiv>

          <FadeDiv>
            <CTAPrimaryButton>Create your booking page</CTAPrimaryButton>
          </FadeDiv>

          <FadeDiv>
            <p className="text-sm text-muted-foreground mt-4">Free forever. No credit card needed.</p>
          </FadeDiv>
        </FadeContainer>
      </section>

      <ProductMockup />


      {/* Trust strip — fix #3: concrete differentiators instead of vague claim */}
      <section className="max-w-6xl mx-auto px-6 py-6 border-t">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          {[
            { icon: "bi-geo-alt-fill", text: "Built exclusively for Sri Lanka" },
            { icon: "bi-currency-dollar", text: "No USD subscriptions" },
            { icon: "bi-percent", text: "Zero commission on bookings" },
            { icon: "bi-whatsapp", text: "Replace WhatsApp chaos for good" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <i className={`bi ${item.icon} text-primary text-xs`} />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 py-20 border-t">

        <div className="pointer-events-none absolute inset-0 select-none">
          {[0, 1].map((pos, i) => (
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
              className="group relative p-7 bg-white hover:bg-primary/[0.03] transition-colors"
            >
              <span className="absolute top-5 right-5 text-[10px] font-mono font-medium text-gray-300 tracking-wider">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="mb-5 inline-flex">
                <div className="flex items-center justify-center size-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 group-hover:ring-primary/25 transition-colors">
                  <i className={`bi ${f.icon} text-[1.15rem] text-primary`} />
                </div>
              </div>

              <h3 className="font-cal text-lg mb-2 tracking-tight text-balance">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{f.desc}</p>

              <Link
                href="/features"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:underline"
              >
                Explore <i className="bi bi-arrow-right" />
              </Link>

              <span className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>
      </section>

      {/* How it works — fix #9: arrow connectors between steps */}
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

        <div className="flex flex-col md:flex-row gap-8 md:gap-0">
          {steps.map((step, i) => (
            <Fragment key={step.number}>
              <div className="flex-1 flex flex-col">
                <div className="mb-5">
                  <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 border border-primary/15">
                    <span className="font-cal text-2xl text-primary">{step.number}</span>
                  </div>
                </div>
                <h3 className="font-cal text-xl mb-2 text-balance">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-start pt-7 px-8 text-gray-300">
                  <i className="bi bi-arrow-right text-2xl" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* Testimonials — fix #2 (credibility) + fix #7 (redundant headings) */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t">
        <div className="text-center mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Early access users
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            What businesses are saying
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
                  <i key={i} className="bi bi-star-fill text-xs text-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-gray-700 flex-1 mb-6 text-pretty">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-full font-cal text-base shrink-0 ${t.color}`}>
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

      {/* CTA — fix #4: backslash → forward slash on secondary button */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-20 text-center shadow-2xl shadow-blue-500/20">
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
                <i className="bi bi-lightning-charge text-xs" />
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
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
                >
                  Create your page
                  <i className="bi bi-arrow-right text-sm" />
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
      <div className="relative px-4 sm:px-6 lg:px-8 pb-6 pt-4">
        <div className="animate-grid-drift pointer-events-none absolute inset-0 bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_100%_80%_at_50%_100%,#000_60%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_100%_80%_at_50%_100%,#000_60%,transparent_100%)]">
        </div>
        <footer className="relative z-10 max-w-6xl mx-auto rounded-[2rem] border border-white/60 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] px-8 sm:px-10 pt-10 pb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pb-8 border-b border-gray-100">
            {/* Brand */}
            <div>
              <div className="mb-1">
                <span className="font-cal text-xl text-gray-900">Dinaya.lk</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Online booking for Sri Lankan businesses. No WhatsApp chaos, no setup fees, no commissions.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Get started free
                <i className="bi bi-arrow-right text-xs" />
              </Link>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Features", href: "/features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Solutions", href: "/solutions" },
                  { label: "Get started", href: "/register" },
                  { label: "Sign in", href: "/login" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">About</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Our Story", href: "/about#story" },
                  { label: "Blog", href: "/blog" },
                  { label: "Contact", href: "/contact" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Brand", href: "/brand" },
                  { label: "Terms of Service", href: "/legal/terms" },
                  { label: "Privacy Policy", href: "/legal/privacy" },
                  { label: "Refund Policy", href: "/legal/refund" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* fix #8: footer logo h-20 → h-4 */}
          <div className="pt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Dinaya by</span>
              <Image
                src="/ardeno-studio-logo.svg"
                alt="Ardeno Studio"
                width={80}
                height={20}
                className="h-4 w-auto brightness-0 opacity-25"
              />
            </div>
            <p className="text-xs text-muted-foreground">Made with ❤️ for Sri Lankan businesses</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
