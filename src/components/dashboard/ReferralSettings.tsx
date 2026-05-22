"use client";

import { buildPlatformReferralUrl, buildReferralBookingUrl } from "@/lib/referrals";

interface Props {
  businessName: string;
  slug: string;
  referralCode: string;
  customDomain?: string | null;
  customDomainVerified?: boolean | null;
  directoryBookings: number;
  referralBookings: number;
}

export function ReferralSettings({
  businessName,
  slug,
  referralCode,
  customDomain,
  customDomainVerified,
  directoryBookings,
  referralBookings,
}: Props) {
  const bookingReferralUrl = buildReferralBookingUrl({
    slug,
    referralCode,
    customDomain,
    customDomainVerified,
  });
  const platformReferralUrl = buildPlatformReferralUrl(referralCode);

  return (
    <div className="rounded-xl border bg-white p-5 space-y-5">
      <div>
        <h2 className="font-semibold">Referrals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share tracked links so you know when bookings come from referrals, WhatsApp, or Instagram.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Client booking referral link</p>
        <code className="mt-1 block truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-primary">
          {bookingReferralUrl}
        </code>
        <p className="mt-2 text-xs text-muted-foreground">
          {referralBookings} booking{referralBookings === 1 ? "" : "s"} tagged as referral for {businessName}.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Refer another business to Dinaya</p>
        <code className="mt-1 block truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-primary">
          {platformReferralUrl}
        </code>
        <p className="mt-2 text-xs text-muted-foreground">
          New signups using your code are linked to {slug}.dinaya.lk in admin reporting later.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50/80 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-gray-800">Track campaigns with UTM links</p>
        <p className="mt-1">
          Append <code>?utm_source=instagram</code>, <code>?utm_source=whatsapp</code>, or{" "}
          <code>?channel=directory</code> to your booking link.
        </p>
        <p className="mt-2">
          Dinaya Directory links are tagged automatically. {directoryBookings} booking
          {directoryBookings === 1 ? "" : "s"} came from the directory.
        </p>
        <p className="mt-2 font-medium text-gray-800">
          Incentive: referred businesses that upgrade to Pro can be reviewed for a one-month Pro credit.
        </p>
      </div>
    </div>
  );
}
