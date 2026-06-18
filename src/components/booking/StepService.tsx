import Image from "next/image";
import { formatLkr, isOptimizableRemoteImage, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/badge";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingRouter } from "@/lib/booking-router";

interface Props {
  services: BookingService[];
  selected: BookingService | null;
  copy: BookingCopy;
  bookingRouter?: BookingRouter | null;
  onSelect: (service: BookingService) => void;
}

function ServiceRow({
  service,
  selected,
  copy,
  onSelect,
}: {
  service: BookingService;
  selected: boolean;
  copy: BookingCopy;
  onSelect: () => void;
}) {
  const depositAmount =
    service.depositPercent > 0
      ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
      : service.priceLkr;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-[var(--booking-accent)] bg-[var(--booking-accent-muted)]/50 ring-2 ring-[var(--booking-accent-soft)]"
          : "border-border hover:border-[var(--booking-accent)]/40 hover:bg-muted/40",
      )}
    >
      {service.imageUrl ? (
        <Image
          src={service.imageUrl}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-lg object-cover"
          unoptimized={!isOptimizableRemoteImage(service.imageUrl)}
        />
      ) : (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--booking-accent-muted)] text-sm font-bold text-[var(--booking-accent)]">
          {service.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", selected ? "text-[var(--booking-accent)]" : "text-foreground")}>
          {service.name}
        </p>
        {service.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <Icon name="clock" />
            {service.durationMinutes}m
          </Badge>
          {service.priceLkr > 0 ? (
            <Badge variant="outline">{formatLkr(service.priceLkr)}</Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
          {service.requiresPayment && service.priceLkr > 0 && service.depositPercent > 0 ? (
            <Badge variant="outline">
              {copy.depositDue}: {formatLkr(depositAmount)}
            </Badge>
          ) : null}
        </div>
      </div>
      <Icon
        name="chevron-right"
        className={cn("mt-1 shrink-0", selected ? "text-[var(--booking-accent)]" : "text-muted-foreground/50")}
      />
    </button>
  );
}

export default function StepService({ services, selected, copy, bookingRouter, onSelect }: Props) {
  if (services.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {copy.noServices}
      </div>
    );
  }

  return (
    <div>
      {bookingRouter && (
        <div className="mb-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {bookingRouter.question}
          </p>
          <div className="space-y-2">
            {bookingRouter.options.map((o) => {
              const target = services.find((s) => s.id === o.serviceId);
              if (!target) return null;
              const isSelected = selected?.id === target.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(target)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-all",
                    isSelected
                      ? "border-[var(--booking-accent)] bg-[var(--booking-accent-muted)]/50 ring-2 ring-[var(--booking-accent-soft)]"
                      : "border-border hover:border-[var(--booking-accent)]/40 hover:bg-muted/40",
                  )}
                >
                  <span className={cn("text-sm font-medium", isSelected ? "text-[var(--booking-accent)]" : "text-foreground")}>
                    {o.label}
                  </span>
                  <Icon name="chevron-right" className="text-xs text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {bookingRouter ? "Or choose a service" : copy.chooseService}
      </p>
      <div className="space-y-2">
        {services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            selected={selected?.id === service.id}
            copy={copy}
            onSelect={() => onSelect(service)}
          />
        ))}
      </div>
    </div>
  );
}
