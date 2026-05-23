import dynamic from "next/dynamic";
import Link from "next/link";
import { LandingNav } from "@/components/LandingNav";
import { ProductMockupSkeleton } from "@/components/ProductMockupSkeleton";
import { WordRotate } from "@/components/WordRotate";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { Icon } from "@/components/ui/Icon";

const HowItWorks = dynamic(() =>
  import("@/components/HowItWorks").then((m) => ({ default: m.HowItWorks }))
);

const ProductMockup = dynamic(() => import("@/components/ProductMockup"), {
  loading: () => <ProductMockupSkeleton />,
});

const features = [
  {
    icon: "calendar-check",
    title: "Self-booking page",
    desc: "Your own link at yourname.dinaya.lk. Clients book 24/7 without calling you.",
  },
  {
    icon: "credit-card",
    title: "Online payments",
    desc: "Accept deposits or full payment via PayHere. Eliminate no-shows instantly.",
  },
  {
    icon: "grid",
    title: "Simple dashboard",
    desc: "See all your bookings in one place. Cancel, reschedule, and track revenue.",
  },
  {
    icon: "bell",
    title: "Automated reminders",
    desc: "Clients get SMS and email reminders before their appointment — automatically.",
  },
  {
    icon: "clock",
    title: "Custom availability",
    desc: "Set your working hours, block dates, and add buffer time between sessions.",
  },
  {
    icon: "share",
    title: "Shareable link",
    desc: "One link for Instagram, WhatsApp, and Facebook. Share everywhere in seconds.",
  },
];

const steps = [
  {
    number: "01",
    icon: "sliders",
    title: "Set up your page",
    desc: "Add your services, prices, and availability. Takes less than 5 minutes.",
  },
  {
    number: "02",
    icon: "send",
    title: "Share your link",
    desc: "Send your dinaya.lk/yourname link via WhatsApp, Instagram, or Facebook.",
  },
  {
    number: "03",
    icon: "calendar-check",
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
    <div className="min-h-dvh bg-white">

      {/* Nav — fix #5 (mobile menu) + fix #6 (dead resource links) via LandingNav */}
      <LandingNav />

      {/* Hero — static markup for fast LCP (no Motion fade-in on headline) */}
      <section className="max-w-4xl mx-auto px-6 pt-28 pb-12 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <a
              href="/register"
              className="inline-flex items-center gap-3 rounded-full bg-white px-2.5 py-0.5 pr-3 pl-0.5 text-sm font-medium text-gray-900 ring-1 shadow-lg shadow-primary/10 ring-black/10 transition-colors hover:bg-primary/5"
            >
              <span className="shrink-0 rounded-full border bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                New
              </span>
              <span className="flex items-center gap-1 truncate">
                Free for Sri Lankan businesses
                <Icon name="arrow-up-right" className="text-xs shrink-0 text-gray-700" />
              </span>
            </a>
          </div>

          <h1 className="font-cal text-5xl tracking-tight mb-6 text-balance">
            Stop the{" "}
            <span className="text-primary">
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
            </span>
            <br />
            Get a real booking page in 5 minutes.
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Give your salon, clinic, or tuition class a free booking page. Clients
            pick a time, pay online, and you get notified.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTAPrimaryButton>Create your booking page</CTAPrimaryButton>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Icon name="play-circle" className="text-base" />
              See a live demo
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-4">Free forever. No credit card needed.</p>
        </div>
      </section>

      <div id="demo">
        <ProductMockup />
      </div>


      {/* Trust strip — fix #3: concrete differentiators instead of vague claim */}
      <section className="max-w-6xl mx-auto px-6 py-6 border-t">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          {[
            { icon: "geo-alt-fill", text: "Built exclusively for Sri Lanka" },
            { icon: "currency-dollar", text: "No USD subscriptions" },
            { icon: "percent", text: "Zero commission on bookings" },
            { icon: "whatsapp", text: "Replace WhatsApp chaos for good" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <Icon name={item.icon} className="text-primary text-xs" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Payment providers — localized trust signals */}
        <div className="mt-5 pt-5 border-t border-dashed border-gray-200/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
            Accept payments via
          </span>
          {["PayHere", "Visa", "Mastercard", "LankaQR", "FriMi"].map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <HowItWorks />

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
                  <Icon name={f.icon} className="text-[1.15rem] text-primary" />
                </div>
              </div>

              <h3 className="font-cal text-lg mb-2 tracking-tight text-balance">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{f.desc}</p>

              <Link
                href="/features"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:underline"
              >
                Explore <Icon name="arrow-right" />
              </Link>

              <span className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 border-t">
        <div className="text-center mb-16">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            How it works
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            Up and running in minutes
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-10">
          {/* Connecting line behind the icons */}
          <div className="hidden md:block absolute top-7 left-[16.5%] right-[16.5%] h-px bg-gray-200" />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              {/* Icon badge with step number dot */}
              <div className="relative z-10 mb-6">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm ring-4 ring-white">
                  <Icon name={step.icon} className="text-xl text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {parseInt(step.number)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{step.desc}</p>
            </div>
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
                  <Icon key={i} name="star-fill" className="text-xs text-amber-400" />
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
      <section className="relative z-10 px-6 pb-20">
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
                <Icon name="lightning-charge" className="text-xs" />
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
                  <Icon name="arrow-right" className="text-sm" />
                </Link>
                <Link
                  href="/auth/signin"
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
      <LandingFooter />
    </div>
  );
}
