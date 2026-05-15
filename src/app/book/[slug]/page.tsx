import { notFound } from "next/navigation";
import { db } from "@/db";
import { businesses, services, staff, staffServices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import BookingWizard from "@/components/booking/BookingWizard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [business] = await db
    .select({ name: businesses.name, description: businesses.description })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) return {};
  return {
    title: `Book an appointment — ${business.name}`,
    description: business.description ?? `Book online with ${business.name}`,
  };
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) notFound();

  const serviceList = await db
    .select()
    .from(services)
    .where(and(eq(services.businessId, business.id), eq(services.isActive, true)));

  const staffList = await db
    .select()
    .from(staff)
    .where(and(eq(staff.businessId, business.id), eq(staff.isActive, true)));

  // Staff→service assignments
  const assignments = await db
    .select({ staffId: staffServices.staffId, serviceId: staffServices.serviceId })
    .from(staffServices)
    .innerJoin(staff, eq(staffServices.staffId, staff.id))
    .where(eq(staff.businessId, business.id));

  return (
    <div className="min-h-dvh bg-muted/20">
      {/* Business header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt={business.name}
              className="size-12 rounded-full object-cover border shrink-0"
            />
          ) : (
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-cal text-xl truncate text-balance">{business.name}</h1>
            {business.description && (
              <p className="text-muted-foreground text-sm mt-0.5 truncate text-pretty">{business.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking wizard */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BookingWizard
          business={business}
          services={serviceList}
          staff={staffList}
          staffServiceMap={assignments}
        />
      </div>

      <footer className="text-center pb-10 text-xs text-muted-foreground/60">
        Powered by{" "}
        <a href="https://dinaya.lk" className="text-primary hover:underline">
          Dinaya.lk
        </a>
      </footer>
    </div>
  );
}
