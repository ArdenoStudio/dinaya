"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { Icon } from "@/components/ui/Icon";
import { LANDING_LIVE_DEMO_PATH } from "@/lib/landing-demo";

type DayCell = { day: number | null; status?: "available" | "booked" | "selected" };

type Slot = { label: string; badge?: string };

type PersonaData = {
  business: string;
  icon: string;
  categoryName: string;
  services: { name: string; duration: string; price: string; selected: boolean }[];
  slots: Slot[];
  trust: { rating: number; bookings: number };
};

const INITIAL_SELECTED_SLOT = 2;

const primaryPersona: PersonaData = {
  business: "Dilini's Beauty Studio",
  icon: "scissors",
  categoryName: "Hair Services",
  services: [
    { name: "Haircut & Style", duration: "45 min", price: "Rs. 2,500", selected: true },
    { name: "Facial Treatment", duration: "60 min", price: "Rs. 3,800", selected: false },
    { name: "Eyebrow Threading", duration: "20 min", price: "Rs. 800", selected: false },
  ],
  slots: [
    { label: "9:00 AM" },
    { label: "10:30 AM" },
    { label: "11:00 AM" },
    { label: "2:00 PM" },
    { label: "3:30 PM" },
    { label: "4:00 PM", badge: "Last slot!" },
  ],
  trust: { rating: 4.9, bookings: 240 },
};

const mockDays: DayCell[] = [
  { day: null }, { day: null }, { day: null },
  { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 },
  { day: 5, status: "booked" }, { day: 6, status: "booked" },
  { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 },
  { day: 12, status: "available" }, { day: 13, status: "available" }, { day: 14, status: "available" },
  { day: 15, status: "selected" },
  { day: 16 }, { day: 17 }, { day: 18 },
  { day: 19, status: "available" }, { day: 20, status: "available" }, { day: 21, status: "available" },
  { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 },
];

/** Visual scale for the landing demo (~20% larger). */
const DEMO_SCALE = 1.2;

function DinayaLogo({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="318 319 875 866" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
      <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
    </svg>
  );
}

function DinayaBranding({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card ${compact ? "px-2.5 py-1" : "px-3 py-1.5"}`}>
      <span className={`text-muted-foreground ${compact ? "text-[11px]" : "text-xs"}`}>Powered by</span>
      <span className="inline-flex items-center gap-1 text-foreground">
        <DinayaLogo size={compact ? 11 : 15} />
        <span className={`font-cal leading-none text-foreground ${compact ? "text-[11px]" : "text-xs"}`}>Dinaya.lk</span>
      </span>
    </div>
  );
}

function TrustLine({ persona, light = false }: { persona: PersonaData; light?: boolean }) {
  return (
    <p className={`text-xs mt-0.5 tabular-nums ${light ? "text-blue-200/90" : "text-gray-500 dark:text-gray-400"}`}>
      {persona.trust.rating} ★ · {persona.trust.bookings} bookings
    </p>
  );
}

function CalendarDay({ cell }: { cell: DayCell }) {
  const d = cell.day;
  if (!d) return <div />;

  const isSelected = cell.status === "selected";
  const isBooked = cell.status === "booked";
  const isAvailable = cell.status === "available";

  return (
    <div
      className={`relative mx-auto flex size-7 items-center justify-center rounded-lg text-[9px] font-medium tabular-nums transition-[background-color,transform,box-shadow] duration-150 ease-out xl:size-8 xl:rounded-xl xl:text-[10px] ${
        isSelected
          ? "bg-blue-600 text-white shadow-md"
          : isBooked
            ? "cursor-not-allowed text-muted-foreground/35 line-through"
            : d
              ? "text-foreground hover:bg-muted"
              : ""
      }`}
    >
      {d}
      {isAvailable && !isSelected ? (
        <span className="absolute bottom-0.5 size-1 rounded-full bg-blue-600" />
      ) : null}
    </div>
  );
}

function BackPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/95 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
      <Icon name="chevron-left" className="text-[8px]" />
      {label}
    </span>
  );
}

function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[9rem] shrink-0 items-center truncate rounded-full border border-border/60 bg-muted/35 px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-muted/20">
      {label}
    </span>
  );
}

function BookingContextNav({ backLabel, categoryLabel }: { backLabel: string; categoryLabel: string }) {
  return (
    <nav aria-label="Booking context" className="flex min-w-0 items-center gap-2">
      <BackPill label={backLabel} />
      <CategoryPill label={categoryLabel} />
    </nav>
  );
}

function PhoneDateTimeScreen({
  persona,
  selectedSlot,
  onSelectSlot,
}: {
  persona: PersonaData;
  selectedSlot: number;
  onSelectSlot: (index: number) => void;
}) {
  const selectedService = persona.services.find((s) => s.selected)!;
  const selectedTime = persona.slots[selectedSlot].label;

  return (
    <div className="flex h-full w-full flex-col bg-muted/40 dark:bg-black">
      <div className="px-[14px] pb-[8px] pt-[58px]">
        <BookingContextNav backLabel="All services" categoryLabel={persona.categoryName} />
      </div>

      <div className="mx-[14px] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="pb-[10px]">
          <div className="flex items-start gap-[10px]">
            <div className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
              <Icon name={persona.icon} className="text-[13px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">{persona.business}</p>
              <TrustLine persona={persona} />
            </div>
          </div>

          <div className="mt-[12px] border-t border-border/70 pt-[12px]">
            <p className="text-[15px] font-semibold leading-tight text-foreground">{selectedService.name}</p>
            <p className="mt-[6px] flex items-center gap-[6px] text-[11px] text-muted-foreground">
              <Icon name="clock" className="text-[11px]" />
              {selectedService.duration.replace(" min", "m")}
              <span className="text-muted-foreground/50">·</span>
              <span className="font-medium tabular-nums text-foreground">{selectedService.price}</span>
            </p>
          </div>
        </div>

        <div className="border-y border-border py-[10px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">May 2025</span>
            <div className="flex gap-1 text-muted-foreground">
              <Icon name="chevron-left" className="text-[9px]" />
              <Icon name="chevron-right" className="text-[9px]" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="pb-0.5 text-[7px] font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
            {mockDays.map((cell, i) => (
              <CalendarDay key={i} cell={cell} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-[10px]">
          <p className="mb-2 text-[11px] font-semibold text-foreground">Thu 15 · Available times</p>
          <div className="grid grid-cols-2 gap-1.5">
            {persona.slots.map((slot, i) => (
              <SlotButton
                key={slot.label}
                label={slot.label}
                selected={i === selectedSlot}
                onSelect={() => onSelectSlot(i)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-border pb-[16px] pt-[10px]">
          <button
            type="button"
            className="w-full rounded-xl bg-blue-600 py-[12px] text-[13px] font-semibold text-white shadow-sm transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100"
          >
            Continue · {selectedTime}
          </button>
        </div>
      </div>

      <div className="flex justify-center py-[8px]">
        <DinayaBranding compact />
      </div>
    </div>
  );
}

function SlotButton({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[34px] w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium tabular-nums transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100 ${
        selected
          ? "border-transparent bg-blue-600 text-white shadow-sm"
          : "border-border bg-secondary/40 text-foreground ring-1 ring-white/5 hover:border-blue-400/40"
      }`}
    >
      {!selected ? <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden /> : null}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {selected ? <Icon name="check" className="shrink-0 text-[8px] opacity-90" /> : null}
    </button>
  );
}

function CustomerBookingDesktop({
  persona,
  selectedSlot,
  onSelectSlot,
}: {
  persona: PersonaData;
  selectedSlot: number;
  onSelectSlot: (index: number) => void;
}) {
  const selectedService = persona.services.find((s) => s.selected)!;
  const selectedTime = persona.slots[selectedSlot].label;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30 p-4 dark:bg-black sm:p-5">
      <div className="mb-3 shrink-0">
        <BookingContextNav backLabel="All services" categoryLabel={persona.categoryName} />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-none dark:ring-1 dark:ring-white/10">
        <aside className="flex w-[30%] max-w-[14rem] shrink-0 flex-col border-r border-border px-3.5 py-4 xl:max-w-[15rem] xl:px-4">
          <div className="flex items-start gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
              <Icon name={persona.icon} className="text-sm" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{persona.business}</p>
              <TrustLine persona={persona} />
            </div>
          </div>

          <div className="mt-4 border-t border-border/70 pt-4">
            <p className="text-base font-semibold leading-tight text-foreground">{selectedService.name}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">Professional cut and styling.</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="clock" className="text-[10px]" />
              {selectedService.duration.replace(" min", "m")}
              <span className="text-muted-foreground/50">·</span>
              <span className="font-medium tabular-nums text-foreground">{selectedService.price}</span>
            </p>
          </div>

          <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="calendar3" className="shrink-0 text-[11px]" />
              <span className="text-foreground">Thu, 15 May 2025</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="clock" className="shrink-0 text-[11px] text-blue-600" />
              <span className="font-medium text-foreground">{selectedTime}</span>
            </div>
          </div>
        </aside>

        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,11rem)] divide-x divide-border xl:grid-cols-[minmax(0,1fr)_minmax(0,12.5rem)]">
          <div className="p-3.5 xl:px-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">May 2025</span>
              <div className="flex gap-1">
                <span className="flex size-6 items-center justify-center rounded-lg text-muted-foreground">
                  <Icon name="chevron-left" className="text-[9px]" />
                </span>
                <span className="flex size-6 items-center justify-center rounded-lg text-muted-foreground">
                  <Icon name="chevron-right" className="text-[9px]" />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="pb-1 text-[8px] font-semibold tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
              {mockDays.map((cell, i) => (
                <CalendarDay key={i} cell={cell} />
              ))}
            </div>
          </div>

          <div className="p-3.5 xl:px-4">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Thu 15</p>
              <p className="text-[10px] text-muted-foreground">Available times</p>
            </div>
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Morning</p>
            <div className="grid grid-cols-2 gap-1.5">
              {persona.slots.slice(0, 4).map((slot, i) => (
                <SlotButton
                  key={slot.label}
                  label={slot.label}
                  selected={i === selectedSlot}
                  onSelect={() => onSelectSlot(i)}
                />
              ))}
            </div>
            <p className="mb-1.5 mt-2.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Afternoon</p>
            <div className="grid grid-cols-2 gap-1.5">
              {persona.slots.slice(4).map((slot, i) => (
                <SlotButton
                  key={slot.label}
                  label={slot.label}
                  selected={i + 4 === selectedSlot}
                  onSelect={() => onSelectSlot(i + 4)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex shrink-0 justify-center">
        <DinayaBranding compact />
      </div>
    </div>
  );
}

function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="aspect-[16/10] min-h-[300px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-none dark:ring-1 dark:ring-white/10">
      {children}
    </div>
  );
}

export default function ProductMockup() {
  const [selectedSlot, setSelectedSlot] = useState(INITIAL_SELECTED_SLOT);
  const { resolvedTheme } = useTheme();
  const screenBg = resolvedTheme === "dark" ? "#000000" : "#f4f4f5";
  const persona = primaryPersona;

  const mobileScale = 0.72 * DEMO_SCALE;
  const mobileOuterWidth = 417;
  const mobileOuterHeight = 876;
  const mobileScaledWidth = Math.round(mobileOuterWidth * mobileScale);
  const mobileScaledHeight = Math.round(mobileOuterHeight * mobileScale);

  return (
    <section className="relative mx-auto max-w-[77rem] overflow-x-clip px-6 pb-16 md:px-12 lg:px-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/80 blur-2xl dark:bg-blue-950/20" />
      </div>

      <div className="flex flex-col items-center md:hidden">
        <div
          className="relative mx-auto overflow-hidden"
          style={{ width: mobileScaledWidth, height: mobileScaledHeight }}
        >
          <IPhoneMockup
            model="15-pro"
            color="space-black"
            scale={mobileScale}
            screenBg={screenBg}
            shadow
            safeArea={false}
            showHomeIndicator={false}
            innerShadow={false}
            style={{ transformOrigin: "top left" }}
          >
            <PhoneDateTimeScreen
              persona={persona}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          </IPhoneMockup>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Tap a time slot to preview the flow</p>
      </div>

      <div className="mx-auto hidden max-w-5xl md:block">
        <DemoFrame>
          <CustomerBookingDesktop
            persona={persona}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />
        </DemoFrame>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Interactive preview —{" "}
          <Link href={LANDING_LIVE_DEMO_PATH} className="font-medium text-primary hover:text-primary/80">
            open the live booking page
          </Link>
        </p>
      </div>
    </section>
  );
}
