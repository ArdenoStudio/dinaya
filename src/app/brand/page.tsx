import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { Logo } from "@/components/Logo";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import ColorScale from "./ColorScale";
import { FluidParticlesBackground } from "@/components/ui/fluid-particles-background";
import { LandingFooter } from "@/components/LandingFooter";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Brand Guidelines — Logo, Colors & Typography | Dinaya",
  description:
    "Official Dinaya brand assets, guidelines, and resources. Download logos, explore our color palette, typography, and voice guidelines.",
};

const LOGO_PATH =
  "M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z";

const blueScale = [
  { shade: "100", hex: "#DBEAFE", light: true },
  { shade: "200", hex: "#BFDBFE", light: true },
  { shade: "300", hex: "#93C5FD", light: true },
  { shade: "400", hex: "#60A5FA", light: true },
  { shade: "500", hex: "#3B82F6", light: false },
  { shade: "600", hex: "#2563EB", light: false },
  { shade: "700", hex: "#1D4ED8", light: false },
  { shade: "800", hex: "#1E40AF", light: false },
  { shade: "900", hex: "#1E3A8A", light: false },
];

const violetScale = [
  { shade: "100", hex: "#EDE9FE", light: true },
  { shade: "200", hex: "#DDD6FE", light: true },
  { shade: "300", hex: "#C4B5FD", light: true },
  { shade: "400", hex: "#A78BFA", light: true },
  { shade: "500", hex: "#8B5CF6", light: false },
  { shade: "600", hex: "#7C3AED", light: false },
  { shade: "700", hex: "#6D28D9", light: false },
  { shade: "800", hex: "#5B21B6", light: false },
  { shade: "900", hex: "#4C1D95", light: false },
];

const amberScale = [
  { shade: "100", hex: "#FEF3C7", light: true },
  { shade: "200", hex: "#FDE68A", light: true },
  { shade: "300", hex: "#FCD34D", light: true },
  { shade: "400", hex: "#FBBF24", light: true },
  { shade: "500", hex: "#F59E0B", light: true },
  { shade: "600", hex: "#D97706", light: false },
  { shade: "700", hex: "#B45309", light: false },
  { shade: "800", hex: "#92400E", light: false },
  { shade: "900", hex: "#78350F", light: false },
];

const greenScale = [
  { shade: "100", hex: "#DCFCE7", light: true },
  { shade: "200", hex: "#BBF7D0", light: true },
  { shade: "300", hex: "#86EFAC", light: true },
  { shade: "400", hex: "#4ADE80", light: true },
  { shade: "500", hex: "#22C55E", light: false },
  { shade: "600", hex: "#16A34A", light: false },
  { shade: "700", hex: "#15803D", light: false },
  { shade: "800", hex: "#166534", light: false },
  { shade: "900", hex: "#14532D", light: false },
];

const slateScale = [
  { shade: "100", hex: "#F1F5F9", light: true },
  { shade: "200", hex: "#E2E8F0", light: true },
  { shade: "300", hex: "#CBD5E1", light: true },
  { shade: "400", hex: "#94A3B8", light: true },
  { shade: "500", hex: "#64748B", light: false },
  { shade: "600", hex: "#475569", light: false },
  { shade: "700", hex: "#334155", light: false },
  { shade: "800", hex: "#1E293B", light: false },
  { shade: "900", hex: "#0F172A", light: false },
];

const voice = [
  {
    trait: "Direct",
    icon: "arrow-right",
    desc: "We say what we mean. No filler words, no corporate speak. Clients book. You get paid. Done.",
  },
  {
    trait: "Warm",
    icon: "heart",
    desc: "We're building for real people running real businesses in Sri Lanka. We know the context, and we speak the language.",
  },
  {
    trait: "Confident",
    icon: "shield-check",
    desc: "We don't hedge. Dinaya works. Our copy reflects that without being arrogant.",
  },
];

const dos = [
  "Use the logo on clean white or dark backgrounds",
  "Maintain clear space equal to the height of the icon around the logo",
  "Use official brand colours from this page",
  "Use CalSans for all display and heading text",
];

const donts = [
  "Stretch, rotate, or distort the logo in any way",
  "Change the logo colours or apply drop shadows or effects",
  "Place the logo on busy or low-contrast backgrounds",
  "Recreate the logo using a different typeface",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 shadow-sm mb-4">
      {children}
    </span>
  );
}

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />

      {/* Hero */}
      <div className="relative">
      <FluidParticlesBackground
        particleCount={1200}
        noiseIntensity={0.0025}
        particleSize={{ min: 0.4, max: 1.8 }}
        className="min-h-[420px]"
      >
        <section className="w-full max-w-4xl mx-auto px-6 public-page-offset pb-20 text-center">
          <FadeContainer className="flex flex-col items-center">
            <FadeDiv className="mb-5">
              <SectionLabel>
                <Icon name="palette" className="text-primary" />
                Brand
              </SectionLabel>
            </FadeDiv>
            <h1 className="font-cal text-5xl md:text-6xl tracking-tight mb-5">
              <FadeSpan>Dinaya</FadeSpan>{" "}
              <FadeSpan className="text-primary">Brand</FadeSpan>
            </h1>
            <FadeDiv>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Assets, guidelines, and everything you need to represent Dinaya correctly.
              </p>
            </FadeDiv>
          </FadeContainer>
        </section>
      </FluidParticlesBackground>
      {/* Bottom fade mask */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
      </div>

      {/* Logo */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-gray-100 dark:border-neutral-800 pt-20">
        <FadeContainer>
          <FadeDiv className="mb-2">
            <SectionLabel>
              <Icon name="vector-pen" className="text-primary" />
              Logo
            </SectionLabel>
          </FadeDiv>
          <FadeDiv className="mb-10">
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">The mark</h2>
            <p className="text-muted-foreground max-w-xl">
              The Dinaya logo consists of the geometric spiral mark and the wordmark. Use them together whenever possible.
            </p>
          </FadeDiv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Default */}
            <FadeDiv className="flex flex-col">
              <div className="flex-1 flex items-center justify-center rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm h-44 p-6">
                <Logo size="lg" href="#" />
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <Icon name="download" className="text-[10px]" /> SVG
                </span>
              </div>
            </FadeDiv>

            {/* Icon only */}
            <FadeDiv className="flex flex-col">
              <div className="flex-1 flex items-center justify-center rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm h-44 p-6">
                <svg
                  width={48}
                  height={48}
                  viewBox="318 319 875 866"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  fill="currentColor"
                  className="text-foreground"
                >
                  <path d={LOGO_PATH} />
                </svg>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Icon only</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <Icon name="download" className="text-[10px]" /> SVG
                </span>
              </div>
            </FadeDiv>

            {/* Dark */}
            <FadeDiv className="flex flex-col">
              <div className="flex-1 flex items-center justify-center rounded-2xl bg-slate-950 shadow-sm h-44 p-6">
                <span className="flex items-center gap-2 text-white text-xl">
                  <svg
                    width={30}
                    height={30}
                    viewBox="318 319 875 866"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d={LOGO_PATH} />
                  </svg>
                  <span className="font-cal leading-none">Dinaya.lk</span>
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <Icon name="download" className="text-[10px]" /> SVG
                </span>
              </div>
            </FadeDiv>

            {/* Brand blue */}
            <FadeDiv className="flex flex-col">
              <div className="flex-1 flex items-center justify-center rounded-2xl bg-blue-600 shadow-sm h-44 p-6">
                <span className="flex items-center gap-2 text-white text-xl">
                  <svg
                    width={30}
                    height={30}
                    viewBox="318 319 875 866"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d={LOGO_PATH} />
                  </svg>
                  <span className="font-cal leading-none">Dinaya.lk</span>
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand blue</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <Icon name="download" className="text-[10px]" /> SVG
                </span>
              </div>
            </FadeDiv>
          </div>
        </FadeContainer>
      </section>

      {/* Colours */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-gray-100 dark:border-neutral-800 pt-20">
        <FadeContainer>
          <FadeDiv className="mb-2">
            <SectionLabel>
              <Icon name="droplet-half" className="text-primary" />
              Colours
            </SectionLabel>
          </FadeDiv>
          <FadeDiv className="mb-10">
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">The palette</h2>
            <p className="text-muted-foreground max-w-xl">
              Four expressive colours anchored by a neutral slate stack. Click any swatch to copy its hex value.
            </p>
          </FadeDiv>

          <div className="space-y-5">
            <FadeDiv>
              <ColorScale label="Blue — Primary" swatches={blueScale} />
            </FadeDiv>
            <FadeDiv>
              <ColorScale label="Violet — Engagement" swatches={violetScale} />
            </FadeDiv>
            <FadeDiv>
              <ColorScale label="Amber — Booking" swatches={amberScale} />
            </FadeDiv>
            <FadeDiv>
              <ColorScale label="Green — Availability" swatches={greenScale} />
            </FadeDiv>
            <FadeDiv>
              <ColorScale label="Slate — Neutral" swatches={slateScale} />
            </FadeDiv>
          </div>
        </FadeContainer>
      </section>

      {/* Typography */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-gray-100 dark:border-neutral-800 pt-20">
        <FadeContainer>
          <FadeDiv className="mb-2">
            <SectionLabel>
              <Icon name="type" className="text-primary" />
              Typography
            </SectionLabel>
          </FadeDiv>
          <FadeDiv className="mb-10">
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">The type</h2>
            <p className="text-muted-foreground max-w-xl">
              Two typefaces, each with a distinct job. CalSans commands attention. Inter handles everything else.
            </p>
          </FadeDiv>

          <div className="grid md:grid-cols-2 gap-4">
            {/* CalSans */}
            <FadeDiv className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm p-8 flex flex-col gap-5">
              <div>
                <p className="font-cal text-7xl tracking-tight text-gray-900 dark:text-gray-100 leading-none">Aa</p>
              </div>
              <p className="font-cal text-base tracking-wide text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 leading-relaxed">
                A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
              </p>
              <p className="font-cal text-xl tracking-tight text-gray-800 dark:text-gray-200 leading-snug">
                &quot;Your calendar, open for business.&quot;
              </p>
              <div className="border-t border-gray-100 dark:border-neutral-800 pt-4 space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">CalSans SemiBold</p>
                <p className="text-xs text-muted-foreground">Display &amp; Headings · Weight 600</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for all headings, hero text, and brand moments where authority matters.
                </p>
              </div>
            </FadeDiv>

            {/* Inter */}
            <FadeDiv className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm p-8 flex flex-col gap-5">
              <div>
                <p className="font-sans text-7xl font-light text-gray-900 dark:text-gray-100 leading-none">Aa</p>
              </div>
              <p className="font-sans text-base text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 leading-relaxed tracking-wide">
                A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
              </p>
              <p className="font-sans text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                &quot;Give your business a booking page. No more WhatsApp back-and-forth.&quot;
              </p>
              <div className="border-t border-gray-100 dark:border-neutral-800 pt-4 space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Inter</p>
                <p className="text-xs text-muted-foreground">Body &amp; UI · Variable</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for body copy, labels, form fields, and all functional UI elements.
                </p>
              </div>
            </FadeDiv>
          </div>
        </FadeContainer>
      </section>

      {/* Voice & Tone */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-gray-100 dark:border-neutral-800 pt-20">
        <FadeContainer>
          <FadeDiv className="mb-2">
            <SectionLabel>
              <Icon name="chat-quote" className="text-primary" />
              Voice &amp; Tone
            </SectionLabel>
          </FadeDiv>
          <FadeDiv className="mb-10">
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">How we sound</h2>
            <p className="text-muted-foreground max-w-xl">
              Every word in Dinaya — from marketing to error messages — should feel like it came from the same person.
            </p>
          </FadeDiv>

          <div className="grid md:grid-cols-3 gap-4">
            {voice.map((v) => (
              <FadeDiv key={v.trait} className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 mb-5">
                  <Icon name={v.icon} className="text-blue-600 text-base" />
                </div>
                <h3 className="font-cal text-xl tracking-tight mb-2">{v.trait}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </FadeDiv>
            ))}
          </div>
        </FadeContainer>
      </section>

      {/* Usage guidelines */}
      <section className="max-w-6xl mx-auto px-6 pb-24 border-t border-gray-100 dark:border-neutral-800 pt-20">
        <FadeContainer>
          <FadeDiv className="mb-2">
            <SectionLabel>
              <Icon name="shield" className="text-primary" />
              Usage guidelines
            </SectionLabel>
          </FadeDiv>
          <FadeDiv className="mb-10">
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">Do&apos;s &amp; don&apos;ts</h2>
            <p className="text-muted-foreground max-w-xl">
              These rules keep the brand consistent and recognisable wherever it appears.
            </p>
          </FadeDiv>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Do */}
            <FadeDiv className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                  <Icon name="check-lg" className="text-blue-600 text-sm" />
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Do</span>
              </div>
              <ul className="space-y-3">
                {dos.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <Icon name="check" className="text-blue-500 text-base mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </FadeDiv>

            {/* Don't */}
            <FadeDiv className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                  <Icon name="x-lg" className="text-red-500 text-sm" />
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Don&apos;t</span>
              </div>
              <ul className="space-y-3">
                {donts.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <Icon name="x-lg" className="text-red-400 text-base mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </FadeDiv>
          </div>
        </FadeContainer>
      </section>
      <LandingFooter />
    </main>
  );
}
