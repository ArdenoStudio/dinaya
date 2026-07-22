import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { LandingNav } from "@/components/LandingNav";
import { LandingHero } from "@/components/LandingHero";
import { LandingFooter } from "@/components/LandingFooter";
import { LandingIndustries } from "@/components/LandingIndustries";
import { LandingFinalCta } from "@/components/LandingFinalCta";
import { Icon } from "@/components/ui/Icon";
import { BeforeAfterToggle } from "@/components/BeforeAfterToggle";
import { FeatureShowcase } from "@/components/FeatureShowcase";

const HowItWorks = dynamic(() =>
  import("@/components/HowItWorks").then((m) => ({ default: m.HowItWorks }))
);

export const metadata: Metadata = {
  title: "Dinaya — Booking pages for Sri Lankan service businesses",
  description:
    "Stop WhatsApp booking chaos. Get a real booking page in 5 minutes — PayHere deposits, reminders, and LKR pricing. 14-day free trial, no card required.",
};

const ownerOutcomes = [
  {
    title: "Bookings while you sleep",
    body: "Instagram and WhatsApp traffic convert on your page after hours — not only when you reply.",
    icon: "clock",
  },
  {
    title: "Deposits up front",
    body: "Optional PayHere deposits cut no-shows without awkward payment chasing in chat.",
    icon: "credit-card",
  },
  {
    title: "Reminders on autopilot",
    body: "Clients get confirmation and reminders. You stop being the human calendar.",
    icon: "bell",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white dark:bg-neutral-950">
      <LandingNav />

      <LandingHero />

      <section className="max-w-6xl mx-auto px-6 py-20 border-t">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <BeforeAfterToggle />
          <div>
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              The difference
            </span>
            <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight text-balance">
              WhatsApp stays. The chaos leaves.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-pretty">
              Dinaya does not replace WhatsApp — it gives WhatsApp a booking link.
              Clients self-serve times and deposits; you run the appointment.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {[
                "Bookings while you sleep",
                "No double bookings",
                "Deposits collected upfront",
                "Reminders without copy-paste",
              ].map((outcome) => (
                <li key={outcome} className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Icon name="check-circle" className="shrink-0 text-base text-primary" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div id="feature-showcase">
        <FeatureShowcase />
      </div>

      <HowItWorks />

      <section className="max-w-6xl mx-auto px-6 py-20 border-t">
        <div className="max-w-2xl mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Built for owners
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight text-balance">
            What changes when the booking page is live
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Practical outcomes for salons, barbers, clinics, and tuition — not another
            dashboard to babysit.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {ownerOutcomes.map((item) => (
            <div key={item.title} className="border-t border-border pt-6">
              <Icon name={item.icon} className="text-xl text-primary" />
              <h3 className="font-cal mt-4 text-xl tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LandingIndustries />

      <LandingFinalCta />

      <LandingFooter />
    </div>
  );
}
