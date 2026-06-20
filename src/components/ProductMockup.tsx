"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { Icon } from "@/components/ui/Icon";

type DayCell = { day: number | null; status?: "available" | "booked" | "selected" };

type Slot = { label: string; badge?: string };

type PersonaData = {
  business: string;
  location: string;
  icon: string;
  url: string;
  clientName: string;
  categoryName: string;
  services: { name: string; duration: string; price: string; selected: boolean }[];
  slots: Slot[];
  selectedSlot: number;
  trust: { rating: number; bookings: number };
  notif: { title: string; detail: string; amount: string };
  payment: { title: string; detail: string; amount: string };
  confirmationMessage: string;
};

const primaryPersona: PersonaData = {
  business: "Dilini's Beauty Studio",
  location: "Colombo 3 · Open Mon–Sat, 9am–6pm",
  icon: "scissors",
  url: "dilini.dinaya.lk",
  clientName: "Samadhi",
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
  selectedSlot: 2,
  trust: { rating: 4.9, bookings: 240 },
  notif: { title: "New booking!", detail: "Haircut · May 15, 11:00 AM", amount: "Rs. 2,500 paid" },
  payment: { title: "Payment received", detail: "Deposit:", amount: "Rs. 1,250" },
  confirmationMessage:
    "Hi Samadhi, your Haircut & Style at Dilini's Beauty Studio is confirmed for Thu, May 15 at 11:00 AM.",
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

const slides = [
  { type: "customer" as const, label: "Book", ariaLabel: "Customer booking view" },
  { type: "owner" as const, label: "Manage", ariaLabel: "Owner dashboard view" },
  { type: "confirmation" as const, label: "Confirm", ariaLabel: "Booking confirmation message" },
];

const industries = [
  { icon: "scissors", label: "Salons" },
  { icon: "hospital", label: "Clinics" },
  { icon: "book-half", label: "Tuition" },
  { icon: "heart-pulse", label: "Wellness" },
];

/** Visual scale for the landing demo carousel (~20% larger). */
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
    <p className={`text-xs mt-0.5 ${light ? "text-blue-200/90" : "text-gray-500 dark:text-gray-400"}`}>
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
      className={`relative mx-auto flex size-7 items-center justify-center rounded-lg text-[9px] font-medium transition-all xl:size-8 xl:rounded-xl xl:text-[10px] ${
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

function FloatingToast({ persona }: { persona: PersonaData }) {
  return (
    <div className="absolute -top-4 right-4 flex max-w-[220px] items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3.5 shadow-2xl shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-500/30">
        <Icon name="check-lg" className="text-sm text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">{persona.notif.title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{persona.notif.detail}</p>
        <p className="text-[11px] font-semibold text-amber-600">{persona.notif.amount}</p>
      </div>
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

function PhoneDateTimeScreen({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;
  const selectedTime = persona.slots[persona.selectedSlot].label;

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
              <span className="font-medium text-foreground">{selectedService.price}</span>
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
              <SlotButton key={slot.label} label={slot.label} selected={i === persona.selectedSlot} />
            ))}
          </div>
        </div>

        <div className="border-t border-border pb-[16px] pt-[10px]">
          <button
            type="button"
            className="w-full rounded-xl bg-blue-600 py-[12px] text-[13px] font-semibold text-white shadow-sm"
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

function ConfirmationPhoneScreen({ persona }: { persona: PersonaData }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#e5ddd5]">
      <div className="bg-[#075e54] px-[16px] pt-[66px] pb-[12px]">
        <div className="flex items-center gap-[10px]">
          <div className="size-[36px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Icon name={persona.icon} className="text-white text-[16px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[15px] truncate">{persona.business}</p>
            <p className="text-[#a7d4c8] text-[11px]">Business account</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-[12px] py-[16px] flex flex-col justify-end gap-[8px]">
        <div className="self-start max-w-[88%] bg-white dark:bg-neutral-800 rounded-[12px] rounded-tl-[2px] px-[12px] py-[10px] shadow-sm">
          <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-snug">{persona.confirmationMessage}</p>
          <div className="flex items-center justify-end gap-[4px] mt-[4px]">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">11:02 AM</span>
            <Icon name="check-lg" className="text-blue-400 text-[10px]" />
          </div>
        </div>
        <div className="self-start flex items-center gap-[6px] bg-white/80 dark:bg-neutral-800/90 rounded-full px-[10px] py-[5px]">
          <Icon name="check-circle-fill" className="text-emerald-500 text-[12px]" />
          <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">Booking confirmed</span>
        </div>
      </div>

      <div className="px-[14px] pb-[26px] pt-[8px] bg-[#f0f0f0] dark:bg-neutral-900">
        <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 mb-[8px]">
          Automated WhatsApp &amp; email — no manual follow-up
        </p>
        <div className="flex justify-center">
          <DinayaBranding compact />
        </div>
      </div>
    </div>
  );
}

function OwnerDashboardPhoneScreen({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;

  return (
    <div className="flex h-full w-full flex-col bg-muted/30 dark:bg-black">
      <div className="border-b border-border bg-card px-[16px] pb-[14px] pt-[66px]">
        <p className="font-cal text-[15px] font-semibold text-foreground">Dinaya</p>
        <p className="mt-[2px] text-[12px] text-muted-foreground">Today&apos;s schedule</p>
      </div>

      <div className="flex flex-1 flex-col gap-[8px] px-[14px] py-[12px]">
        <div className="grid grid-cols-2 gap-[8px]">
          <div className="rounded-[12px] border border-border bg-card px-[12px] py-[10px]">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</p>
            <p className="mt-[2px] text-[15px] font-bold text-foreground">Rs. 2,500</p>
          </div>
          <div className="rounded-[12px] border border-border bg-card px-[12px] py-[10px]">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bookings</p>
            <p className="mt-[2px] text-[15px] font-bold text-foreground">3 today</p>
          </div>
        </div>

        <div className="rounded-[16px] border border-border bg-card px-[14px] py-[12px]">
          <p className="mb-[8px] text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Up next</p>
          <div className="flex items-center gap-[10px]">
            <div className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-blue-600/10">
              <span className="text-[13px] font-bold text-blue-600">S</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{persona.clientName} Perera</p>
              <p className="text-[11px] text-muted-foreground">{selectedService.name} · 11:00 AM</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-[7px] py-[3px] text-[11px] font-semibold text-emerald-600">
              Paid
            </span>
          </div>
        </div>

        <div className="flex items-center gap-[10px] rounded-[14px] border border-amber-500/20 bg-amber-500/10 px-[12px] py-[10px]">
          <div className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-amber-400">
            <Icon name="check-lg" className="text-[12px] text-white" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-foreground">{persona.notif.title}</p>
            <p className="text-[11px] text-muted-foreground">{persona.notif.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotButton({
  label,
  selected,
}: {
  label: string;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-[34px] w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all ${
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

function CustomerBookingDesktop({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;
  const selectedTime = persona.slots[persona.selectedSlot].label;

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
              <span className="font-medium text-foreground">{selectedService.price}</span>
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
                <SlotButton key={slot.label} label={slot.label} selected={i === persona.selectedSlot} />
              ))}
            </div>
            <p className="mb-1.5 mt-2.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Afternoon</p>
            <div className="grid grid-cols-2 gap-1.5">
              {persona.slots.slice(4).map((slot, i) => (
                <SlotButton
                  key={slot.label}
                  label={slot.label}
                  selected={i + 4 === persona.selectedSlot}
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

function OwnerDashboardDesktop({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;

  const todayBookings = [
    { time: "9:00 AM", client: "Nimali W.", service: "Facial Treatment", status: "Completed", amount: "Rs. 3,800" },
    { time: "11:00 AM", client: `${persona.clientName} P.`, service: selectedService.name, status: "Confirmed", amount: selectedService.price },
    { time: "2:00 PM", client: "Kavindi R.", service: "Eyebrow Threading", status: "Pending", amount: "Rs. 800" },
  ];

  return (
    <div className="h-full overflow-hidden bg-muted/30 p-4 dark:bg-black sm:p-5">
      <div className="flex h-full gap-3">
        <aside className="hidden w-[26%] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card sm:flex">
          <div className="border-b border-border px-3 py-2">
            <p className="font-cal text-xs font-semibold text-foreground">Dinaya</p>
            <p className="truncate text-[9px] text-muted-foreground">{persona.business}</p>
          </div>
          <nav className="flex-1 space-y-0.5 px-1.5 py-1.5">
            {["Overview", "Bookings", "Clients", "Payments", "Settings"].map((item) => (
              <div
                key={item}
                className={`rounded-lg px-2 py-1 text-[11px] ${
                  item === "Bookings"
                    ? "bg-blue-600/10 font-semibold text-blue-600"
                    : "text-muted-foreground"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 flex shrink-0 items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Today&apos;s schedule</h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Thursday, May 15, 2025</p>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground">
                Rs. 7,100 today
              </span>
              <span className="rounded-full border border-blue-600/20 bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                3 bookings
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 border-b border-border bg-muted/30 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Time</span>
              <span>Client</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {todayBookings.map((b) => (
              <div
                key={b.time}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 border-b px-3 py-2 text-xs last:border-b-0 hover:bg-muted/30"
              >
                <span className="w-14 text-[10px] font-medium tabular-nums text-muted-foreground">{b.time}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{b.client}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{b.service}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    b.status === "Confirmed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : b.status === "Completed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {b.status}
                </span>
                <span className="text-right text-[10px] font-semibold tabular-nums text-foreground">{b.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationDesktop({ persona }: { persona: PersonaData }) {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-hidden bg-muted/30 p-4 dark:bg-black sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
            <Icon name="whatsapp" className="text-base text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{persona.business}</p>
            <p className="text-[10px] text-muted-foreground">WhatsApp Business</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
            Sent automatically
          </span>
        </div>

        <div className="rounded-xl bg-[#e5ddd5] p-3 shadow-inner dark:bg-[#0b141a]">
          <div className="max-w-[90%] rounded-lg rounded-tl-sm bg-card px-3 py-2.5 shadow-sm">
            <p className="text-xs leading-relaxed text-foreground">{persona.confirmationMessage}</p>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className="text-[9px] text-muted-foreground">11:02 AM</span>
              <Icon name="check-lg" className="text-[10px] text-blue-400" />
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Icon name="envelope" className="text-xs text-muted-foreground" />
          <span className="truncate">Email sent to {persona.clientName.toLowerCase()}@email.com</span>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Automated WhatsApp &amp; email — no manual follow-up
        </p>
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

function AlsoWorksFor() {
  return (
    <div className="mt-7 text-center">
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2.5">Also works for</p>
      <div className="flex flex-wrap justify-center gap-3.5">
        {industries.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm"
          >
            <Icon name={item.icon} className="text-blue-500 text-base" />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideLabels({
  current,
  onGoTo,
  compact = false,
}: {
  current: number;
  onGoTo: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex justify-center ${compact ? "gap-4" : "gap-5"}`}>
      {slides.map((slide, i) => (
        <button
          key={slide.type}
          type="button"
          onClick={() => onGoTo(i)}
          className={`font-medium transition-colors ${
            compact ? "text-xs" : "text-sm"
          } ${
            i === current
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {slide.label}
        </button>
      ))}
    </div>
  );
}

function SlideDots({
  current,
  onGoTo,
}: {
  current: number;
  onGoTo: (index: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2">
      {slides.map((slide, i) => (
        <button
          key={slide.type}
          type="button"
          onClick={() => onGoTo(i)}
          aria-label={slide.ariaLabel}
          aria-current={i === current ? "true" : undefined}
          className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
            i === current ? "w-6 bg-blue-600" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
          }`}
        />
      ))}
    </div>
  );
}

function SlideIndicators({
  current,
  onGoTo,
}: {
  current: number;
  onGoTo: (index: number) => void;
}) {
  return (
    <div className="mt-9">
      <SlideLabels current={current} onGoTo={onGoTo} />
      <div className="mb-3.5 mt-3.5">
        <SlideDots current={current} onGoTo={onGoTo} />
      </div>
      <AlsoWorksFor />
    </div>
  );
}

function renderMobileScreen(slideType: (typeof slides)[number]["type"], persona: PersonaData) {
  switch (slideType) {
    case "customer":
      return <PhoneDateTimeScreen persona={persona} />;
    case "owner":
      return <OwnerDashboardPhoneScreen persona={persona} />;
    case "confirmation":
      return <ConfirmationPhoneScreen persona={persona} />;
  }
}

function renderDesktopContent(slideType: (typeof slides)[number]["type"], persona: PersonaData) {
  switch (slideType) {
    case "customer":
      return <CustomerBookingDesktop persona={persona} />;
    case "owner":
      return <OwnerDashboardDesktop persona={persona} />;
    case "confirmation":
      return <ConfirmationDesktop persona={persona} />;
  }
}

export default function ProductMockup() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { resolvedTheme } = useTheme();
  const screenBg = resolvedTheme === "dark" ? "#000000" : "#f4f4f5";

  const persona = primaryPersona;
  const slide = slides[current];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function goTo(index: number) {
    if (fading || index === current) return;
    if (reduceMotion) {
      setCurrent(index);
      return;
    }
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 180);
  }

  function navigate(dir: number) {
    goTo((current + dir + slides.length) % slides.length);
  }

  const navBtn = (dir: number, label: string, extraClass: string) => (
    <button
      type="button"
      onClick={() => navigate(dir)}
      aria-label={label}
      className={`z-20 flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition-all hover:border-blue-600/30 hover:text-blue-600 hover:shadow-md ${extraClass}`}
    >
      <Icon name={`chevron-${dir === -1 ? "left" : "right"}`} className="text-base" />
    </button>
  );

  const mobileScale = 0.72 * DEMO_SCALE;
  const mobileOuterWidth = 417; // 15-pro screen + bezel
  const mobileOuterHeight = 876;
  const mobileScaledWidth = Math.round(mobileOuterWidth * mobileScale);
  const mobileScaledHeight = Math.round(mobileOuterHeight * mobileScale);

  const fadeClass = reduceMotion ? "" : fading ? "opacity-0" : "opacity-100";

  return (
    <section className="max-w-[77rem] mx-auto px-6 md:px-12 lg:px-16 pb-16 relative overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[480px] rounded-full bg-blue-50 dark:bg-blue-950/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[220px] h-[220px] rounded-full bg-violet-500/[0.05] blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[180px] h-[180px] rounded-full bg-amber-50 dark:bg-amber-950/20 blur-3xl" />
      </div>

      {/* Mobile — wrapper matches scaled iPhone size so layout does not overflow */}
      <div className="md:hidden flex flex-col items-center">
        <div
          className={`relative mx-auto overflow-hidden transition-opacity duration-200 motion-reduce:transition-none ${fadeClass}`}
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
            {renderMobileScreen(slide.type, persona)}
          </IPhoneMockup>
        </div>
        <div className="mt-5 flex w-full max-w-sm flex-col items-center gap-3">
          <SlideLabels current={current} onGoTo={goTo} compact />
          <div className="flex items-center gap-4">
            {navBtn(-1, "Previous", "")}
            <SlideDots current={current} onGoTo={goTo} />
            {navBtn(1, "Next", "")}
          </div>
        </div>
        <AlsoWorksFor />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center gap-3 lg:gap-5">
          {navBtn(-1, "Previous", "shrink-0")}

          <div className="relative min-w-0 flex-1">
            <div className={`relative transition-opacity duration-200 motion-reduce:transition-none ${fadeClass}`}>
              <DemoFrame>{renderDesktopContent(slide.type, persona)}</DemoFrame>
              {slide.type === "owner" ? <FloatingToast persona={persona} /> : null}
            </div>
          </div>

          {navBtn(1, "Next", "shrink-0")}
        </div>

        <SlideIndicators current={current} onGoTo={goTo} />
      </div>
    </section>
  );
}
