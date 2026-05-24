"use client";

import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { HelpFaqSections } from "@/components/docs/HelpFaqSections";
import { Icon } from "@/components/ui/Icon";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />
      <HelpFaqSections />
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 px-8 py-14 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="font-cal text-2xl md:text-3xl tracking-tight text-white mb-2">
                  Talk to a real person.
                </h2>
                <p className="text-sm text-white/60 max-w-sm">
                  Our team replies in Sinhala, Tamil, or English — usually within a few hours on business days.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <a
                  href="mailto:support@dinaya.lk"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 px-5 py-3 text-sm font-semibold"
                >
                  <Icon name="envelope" className="text-sm" />
                  Email support
                </a>
                <a
                  href="https://wa.me/94770000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 text-white px-5 py-3 text-sm font-medium"
                >
                  <Icon name="whatsapp" className="text-sm" />
                  WhatsApp us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LandingFooter />
    </main>
  );
}
