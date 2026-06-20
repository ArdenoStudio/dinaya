"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Icon } from "@/components/ui/Icon";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";

type Props = {
  copy: BookingCopy;
  cancellationPolicy?: string | null;
  depositPolicy?: string | null;
  bankTransferInstructions?: string | null;
  /** mobile-only accordion vs always visible inside hub card */
  variant?: "mobile" | "embedded";
};

const POLICY_ICONS = {
  cancellation: "calendar-x" as const,
  deposit: "shield-check" as const,
  payment: "bank" as const,
};

export function BookingPolicyAccordion({
  copy,
  cancellationPolicy,
  depositPolicy,
  bankTransferInstructions,
  variant = "mobile",
}: Props) {
  const items = [
    cancellationPolicy ? { id: "cancellation", title: copy.cancellationPolicy, body: cancellationPolicy } : null,
    depositPolicy ? { id: "deposit", title: copy.depositPolicy, body: depositPolicy } : null,
    bankTransferInstructions
      ? { id: "payment", title: copy.localPayment, body: bankTransferInstructions }
      : null,
  ].filter(Boolean) as { id: keyof typeof POLICY_ICONS; title: string; body: string }[];

  if (items.length === 0) return null;

  return (
    <BlurFade inView={variant === "embedded"}>
      <Accordion
        multiple
        className={cn(
          "rounded-xl border border-border/60 bg-muted/20",
          variant === "mobile" && "rounded-none border-x-0 border-t-0 bg-card md:hidden",
        )}
      >
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="border-border/70 px-3 md:px-4">
            <AccordionTrigger className="gap-3 py-3.5 text-sm font-medium hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={POLICY_ICONS[item.id]} className="text-base" />
                </span>
                <span className="truncate text-left text-foreground">{item.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pl-12 text-sm leading-relaxed text-foreground/80">
              {item.body}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </BlurFade>
  );
}
