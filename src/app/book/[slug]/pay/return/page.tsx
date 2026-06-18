import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBookingCopy } from "@/lib/i18n";
import PayPalReturnHandler from "./PayPalReturnHandler";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BookingPayReturnPage({ params }: Props) {
  const { slug } = await params;

  const [business] = await db
    .select({ language: businesses.language })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) notFound();

  const copy = getBookingCopy(business.language);

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#f2f2f7] px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
              <p className="text-sm text-gray-500">{copy.redirectingToPayment}</p>
            </div>
          }
        >
          <PayPalReturnHandler slug={slug} copy={{ redirectingToPayment: copy.redirectingToPayment }} />
        </Suspense>
      </div>
    </div>
  );
}
