import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { AuthHalftonePanelArt } from "@/components/auth/AuthHalftonePanelArt";
import { Icon } from "@/components/ui/Icon";

const panelPerks = [
  { icon: "calendar", text: "Clients book 24/7 without calling you" },
  { icon: "credit-card", text: "Accept online payments via PayHere" },
  { icon: "grid", text: "Manage everything from one dashboard" },
] as const;

const panelTestimonial = {
  quote:
    "I used to miss bookings because of WhatsApp messages I forgot to reply to. Now everything's in Dinaya and I haven't missed one since.",
  name: "Kavinda Jayasuriya",
  role: "Owner, The Barber Room · Kandy",
};

interface Props {
  children: React.ReactNode;
}

export function AuthSplitShell({ children }: Props) {
  return (
    <div className="relative flex min-h-screen w-full bg-background font-sans text-foreground antialiased">
      <AuthThemeToggle />

      <div className="flex w-full flex-col lg:w-1/2">
        <div className="absolute left-2 top-2 p-6 md:left-4 md:top-4 md:p-10">
          <Logo href="/" size="lg" short />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 pb-10 pt-24 md:p-10 md:pt-28">
          {children}
        </div>
      </div>

      <div className="hidden p-4 lg:block lg:w-1/2">
        <div className="relative flex h-full min-h-[calc(100vh-2rem)] w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-black/10 p-10 text-white">
          <AuthHalftonePanelArt />

          <div className="relative z-10 pt-2">
            <p className="font-cal text-4xl leading-[1.12] tracking-tight text-balance">
              Your calendar,
              <br />
              <span className="text-primary">always full.</span>
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
              Thousands of appointments managed across Sri Lanka — zero phone tag.
            </p>
          </div>

          <div className="relative z-10 space-y-8">
            <ul className="space-y-3">
              {panelPerks.map((perk) => (
                <li key={perk.text} className="flex items-start gap-3">
                  <Icon name={perk.icon} className="mt-0.5 shrink-0 text-sm text-primary" />
                  <span className="text-sm text-white/70">{perk.text}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm italic leading-relaxed text-white/60">
                &ldquo;{panelTestimonial.quote}&rdquo;
              </p>
              <p className="mt-3 text-xs text-white/35">
                {panelTestimonial.name} · {panelTestimonial.role}
              </p>
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/25">
            © {new Date().getFullYear()} Dinaya by{" "}
            <Link href="/about" className="hover:text-white/40 transition-colors">
              Ardeno Studio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
