"use client";

import { BookingTheme } from "@/components/booking/BookingTheme";
import { BookingBusinessIdentity } from "@/components/booking/BookingBusinessIdentity";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { getBookingCopy } from "@/lib/i18n";

const copy = getBookingCopy("en");

export function BookingRatingPreview() {
  return (
    <BookingTheme accentColor="#F97316">
      <div className="booking-page-bg min-h-dvh bg-muted/20 px-4 py-10">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Booking header preview</h1>
            <p className="mt-1 text-sm text-muted-foreground">Two cards · rounded profile · inline rating</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 px-5 py-5">
              <BookingBusinessIdentity
                name="Test"
                copy={copy}
                subtitle={copy.chooseServiceAndTime}
                meta="3 services"
                rating={{ avgRating: 4.7, reviewCount: 1500 }}
                size="lg"
                className="min-w-0 flex-1"
              />
              <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                3 services
              </Badge>
            </CardHeader>
          </Card>
        </div>
      </div>
    </BookingTheme>
  );
}
