"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BookingCopy } from "@/lib/i18n";

type Props = {
  copy: BookingCopy;
  cancellationPolicy?: string | null;
  depositPolicy?: string | null;
  bankTransferInstructions?: string | null;
};

export function BookingPolicyAccordion({
  copy,
  cancellationPolicy,
  depositPolicy,
  bankTransferInstructions,
}: Props) {
  const items = [
    cancellationPolicy ? { id: "cancellation", title: copy.cancellationPolicy, body: cancellationPolicy } : null,
    depositPolicy ? { id: "deposit", title: copy.depositPolicy, body: depositPolicy } : null,
    bankTransferInstructions
      ? { id: "payment", title: copy.localPayment, body: bankTransferInstructions }
      : null,
  ].filter(Boolean) as { id: string; title: string; body: string }[];

  if (items.length === 0) return null;

  return (
    <Accordion multiple className="rounded-none border-x-0 border-t-0 border-b border-border bg-card md:hidden">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="border-border px-4">
          <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="pb-3 text-sm text-muted-foreground">{item.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
