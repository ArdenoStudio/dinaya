"use client";

import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { formatLkr, isOptimizableRemoteImage } from "@/lib/utils";
import { normalizeAccentColor } from "@/lib/booking-theme";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BusinessRating, getBusinessRating } from "./BusinessRating";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "./BookingWizard";

interface Props {
  businessSlug: string;
  businessName: string;
  businessLogoUrl?: string | null;
  services: BookingService[];
  copy: BookingCopy;
  avgRating?: number | null;
  reviewCount?: number;
  businessDescription?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessWebsiteUrl?: string | null;
  businessInstagramUrl?: string | null;
  businessFacebookUrl?: string | null;
  cancellationPolicy?: string | null;
  galleryImages?: string[] | null;
  accentColor?: string | null;
}

const spring = { type: "spring" as const, stiffness: 360, damping: 26, mass: 0.8 };

export default function BookingServiceHub({
  businessSlug,
  businessName,
  businessLogoUrl,
  services,
  copy,
  avgRating,
  reviewCount,
  businessDescription,
  businessAddress,
  businessPhone,
  businessWebsiteUrl,
  businessInstagramUrl,
  businessFacebookUrl,
  cancellationPolicy,
  galleryImages,
  accentColor,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (services.length <= 1) return null;

  const rating = getBusinessRating(avgRating, reviewCount);
  const gallery = galleryImages ?? [];
  const accentHex = normalizeAccentColor(accentColor);

  const cardClass =
    "overflow-hidden rounded-none border-x-0 shadow-none md:rounded-xl md:border md:border-border md:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]";

  function openModal(e: React.MouseEvent) {
    e.stopPropagation();
    setIsHovered(false);
    setShowCompactHeader(false);
    setIsModalOpen(true);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setShowCompactHeader(el.scrollTop > 80);
  }

  const mapsUrl = businessAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(businessAddress)}`
    : null;

  return (
    <>
      <div className="flex w-full flex-col gap-4 md:gap-5">
        {/* Business header with spring hover preview */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Desktop — interactive card with hover expansion */}
          <Card
            className={`${cardClass} hidden cursor-pointer md:block`}
            onClick={openModal}
          >
            <CardHeader
              className="flex flex-row items-start gap-4 space-y-0 pb-4"
              style={{ backgroundImage: `linear-gradient(120deg, ${accentHex}1f, transparent 60%)` }}
            >
              <Avatar className="size-14" data-size="lg">
                {businessLogoUrl ? (
                  <AvatarImage
                    src={businessLogoUrl}
                    alt={businessName}
                    className="object-contain bg-white p-1"
                  />
                ) : null}
                <AvatarFallback className="bg-[var(--booking-accent-muted)] text-lg font-bold text-[var(--booking-accent)]">
                  {businessName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-xl">{businessName}</CardTitle>
                <CardDescription>{copy.chooseServiceAndTime}</CardDescription>
                {rating && (
                  <BusinessRating
                    avgRating={rating.avgRating}
                    reviewCount={rating.reviewCount}
                    copy={copy}
                    size="sm"
                    animateCount
                    className="pt-1"
                  />
                )}
              </div>

              <Badge variant="secondary" className="shrink-0">
                {services.length} services
              </Badge>
            </CardHeader>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  key="hub-expansion"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={spring}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-center bg-[var(--booking-accent-muted)]/60 px-5 py-2.5">
                    <span className="flex items-center gap-1 rounded-full border border-[var(--booking-accent)]/30 px-2.5 py-0.5 text-xs font-medium text-[var(--booking-accent)]">
                      About
                      <Icon name="arrow-right" size={10} />
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Mobile — plain card, no hover */}
          <Card className={`${cardClass} md:hidden`}>
            <CardHeader
              className="flex flex-row items-start gap-4 space-y-0 pb-4"
              style={{ backgroundImage: `linear-gradient(120deg, ${accentHex}1f, transparent 60%)` }}
            >
              <Avatar className="size-14" data-size="lg">
                {businessLogoUrl ? (
                  <AvatarImage
                    src={businessLogoUrl}
                    alt={businessName}
                    className="object-contain bg-white p-1"
                  />
                ) : null}
                <AvatarFallback className="bg-[var(--booking-accent-muted)] text-lg font-bold text-[var(--booking-accent)]">
                  {businessName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-xl">{businessName}</CardTitle>
                <CardDescription>{copy.chooseServiceAndTime}</CardDescription>
                {rating && (
                  <BusinessRating
                    avgRating={rating.avgRating}
                    reviewCount={rating.reviewCount}
                    copy={copy}
                    size="sm"
                    animateCount
                    className="pt-1"
                  />
                )}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {services.length} services
              </Badge>
            </CardHeader>
          </Card>
        </div>

        {/* Services list card */}
        <Card className={cardClass}>
          <CardContent className="p-0">
            {services.map((service, index) => {
              const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
              const depositAmount =
                service.depositPercent > 0
                  ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
                  : service.priceLkr;

              return (
                <div key={service.id}>
                  {index > 0 ? <Separator /> : null}
                  <Link
                    href={href}
                    className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/50 md:px-5"
                  >
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-lg object-cover"
                        unoptimized={!isOptimizableRemoteImage(service.imageUrl)}
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--booking-accent-muted)] text-sm font-bold text-[var(--booking-accent)]">
                        {service.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground group-hover:text-[var(--booking-accent)]">
                        {service.name}
                      </p>
                      {service.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          <Icon name="clock" />
                          {service.durationMinutes}m
                        </Badge>
                        {service.priceLkr > 0 ? (
                          <Badge variant="outline">
                            <Icon name="cash-coin" />
                            {formatLkr(service.priceLkr)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                        {service.requiresPayment && service.depositPercent > 0 && service.priceLkr > 0 ? (
                          <Badge variant="outline">
                            <Icon name="shield-check" />
                            {copy.depositDue}: {formatLkr(depositAmount)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <Icon
                      name="chevron-right"
                      className="mt-1 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-[var(--booking-accent)]"
                    />
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Business details modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] md:w-[85vw] md:max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[52%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[52%] duration-200 max-h-[90vh] flex flex-col">
            <Dialog.Title className="sr-only">{businessName}</Dialog.Title>
            <Dialog.Description className="sr-only">Details for {businessName}</Dialog.Description>

            {/* Compact sticky header — slides in when profile scrolls away */}
            <AnimatePresence>
              {showCompactHeader && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 pr-12 backdrop-blur-md"
                >
                  <Avatar className="size-8 shrink-0" data-size="sm">
                    {businessLogoUrl ? (
                      <AvatarImage src={businessLogoUrl} alt={businessName} className="object-contain bg-white" />
                    ) : null}
                    <AvatarFallback className="bg-[var(--booking-accent)] text-xs font-bold text-white">
                      {businessName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-semibold text-foreground">{businessName}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button — always above everything */}
            <Dialog.Close className="absolute right-3 top-3 z-30 flex size-8 items-center justify-center rounded-full bg-foreground/10 text-foreground backdrop-blur-sm transition-colors hover:bg-foreground/20">
              <Icon name="x-lg" size={13} />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            {/* Single scrollable container */}
            <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>

            {/* Centered profile header — always */}
            <div
              className="flex flex-col items-center px-6 pt-10 pb-7 text-center"
              style={{ background: `linear-gradient(180deg, ${accentHex}22 0%, transparent 100%)` }}
            >
              <Avatar className="size-24 ring-4 ring-background shadow-lg" data-size="lg">
                {businessLogoUrl ? (
                  <AvatarImage src={businessLogoUrl} alt={businessName} className="object-contain bg-white p-2" />
                ) : null}
                <AvatarFallback className="bg-[var(--booking-accent)] text-3xl font-bold text-white">
                  {businessName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{businessName}</h2>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {rating && <BusinessRating avgRating={rating.avgRating} reviewCount={rating.reviewCount} copy={copy} size="sm" />}
                <span className="text-xs text-muted-foreground">{services.length} service{services.length === 1 ? "" : "s"}</span>
              </div>
              {businessDescription && (
                <p className="mt-2 max-w-sm line-clamp-3 text-sm leading-relaxed text-muted-foreground">{businessDescription}</p>
              )}
            </div>

            <Separator />

            {/* Sections */}
            <div className="divide-y divide-border/60">

              {/* Photo gallery — full-bleed strip */}
              <div className="relative py-5">
                {gallery.length > 0 ? (
                  <>
                    <div className="flex gap-2 overflow-x-auto pb-1 pl-6 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {gallery.map((url, i) => (
                        <div key={i} className="relative h-36 w-48 shrink-0 overflow-hidden rounded-xl shadow-sm">
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized={!isOptimizableRemoteImage(url)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
                  </>
                ) : (
                  <div className="flex gap-2 pl-6 pr-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-36 w-48 shrink-0 rounded-xl border border-border/40 bg-muted/40" />
                    ))}
                  </div>
                )}
              </div>

              {/* Find us — card list */}
              <div className="px-6 py-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Find us</p>
                <div className="overflow-hidden rounded-xl border border-border/60 divide-y divide-border/60">
                  {businessAddress ? (
                    <a
                      href={mapsUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <Icon name="geo-alt" size={15} className="shrink-0 text-[var(--booking-accent)]" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/80 transition-colors group-hover:text-[var(--booking-accent)]">{businessAddress}</p>
                        <p className="text-xs text-[var(--booking-accent)]/60">Open in Maps ↗</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 opacity-35">
                      <Icon name="geo-alt" size={15} className="shrink-0 text-muted-foreground" />
                      <span className="text-sm italic text-muted-foreground">No address added</span>
                    </div>
                  )}
                  {businessPhone ? (
                    <a
                      href={`tel:${businessPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <Icon name="telephone" size={15} className="shrink-0 text-[var(--booking-accent)]" />
                      <span className="text-sm text-foreground/80 transition-colors group-hover:text-[var(--booking-accent)]">{businessPhone}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 opacity-35">
                      <Icon name="telephone" size={15} className="shrink-0 text-muted-foreground" />
                      <span className="text-sm italic text-muted-foreground">No phone added</span>
                    </div>
                  )}
                  {businessWebsiteUrl ? (
                    <a
                      href={businessWebsiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <Icon name="globe" size={15} className="shrink-0 text-[var(--booking-accent)]" />
                      <span className="truncate text-sm text-foreground/80 transition-colors group-hover:text-[var(--booking-accent)]">
                        {businessWebsiteUrl.replace(/^https?:\/\//, "")}
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 opacity-35">
                      <Icon name="globe" size={15} className="shrink-0 text-muted-foreground" />
                      <span className="text-sm italic text-muted-foreground">No website added</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow — branded buttons */}
              <div className="px-6 py-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Follow</p>
                <div className="flex gap-2">
                  {businessInstagramUrl ? (
                    <a
                      href={businessInstagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      <Icon name="instagram" size={14} />
                      Instagram
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 rounded-xl border border-border/40 px-4 py-2.5 text-xs font-medium text-muted-foreground/35">
                      <Icon name="instagram" size={14} />
                      Instagram
                    </span>
                  )}
                  {businessFacebookUrl ? (
                    <a
                      href={businessFacebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      <Icon name="facebook" size={14} />
                      Facebook
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 rounded-xl border border-border/40 px-4 py-2.5 text-xs font-medium text-muted-foreground/35">
                      <Icon name="facebook" size={14} />
                      Facebook
                    </span>
                  )}
                </div>
              </div>

              {/* Cancellation policy */}
              {cancellationPolicy && (
                <div className="px-6 py-5">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Cancellation policy</p>
                  <p className="text-sm leading-relaxed text-foreground/80">{cancellationPolicy}</p>
                </div>
              )}

              <div className="h-2" />
            </div>

            </div>{/* end scroll container */}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
