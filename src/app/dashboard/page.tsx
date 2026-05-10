import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, businesses } from "@/db/schema";
import { eq, gte, count, and, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";

export default async function DashboardOverview() {
  const session = await auth();
  const businessId = (session!.user as { businessId: string }).businessId;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [{ bookingsThisWeek }] = await db
    .select({ bookingsThisWeek: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.businessId, businessId),
        gte(bookings.startsAt, weekStart),
        sql`${bookings.startsAt} <= ${weekEnd}`
      )
    );

  const [{ totalBookings }] = await db
    .select({ totalBookings: count() })
    .from(bookings)
    .where(eq(bookings.businessId, businessId));

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace("://", `://${business.slug}.`)}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Good day! 👋</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with {business.name}.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Bookings this week</p>
          <p className="text-3xl font-bold mt-1">{bookingsThisWeek}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total bookings</p>
          <p className="text-3xl font-bold mt-1">{totalBookings}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="text-3xl font-bold mt-1 capitalize">{business.plan}</p>
        </div>
      </div>

      {/* Booking link */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
        <p className="text-sm font-medium mb-2">Your booking page</p>
        <div className="flex items-center gap-3">
          <code className="text-primary text-sm bg-primary/10 px-3 py-1.5 rounded-md flex-1 truncate">
            {business.slug}.dinaya.lk
          </code>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline whitespace-nowrap"
          >
            Open ↗
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/bookings" className="bg-white border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <p className="font-medium text-sm">View all bookings →</p>
        </Link>
        <Link href="/dashboard/services" className="bg-white border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <p className="font-medium text-sm">Manage services →</p>
        </Link>
      </div>
    </div>
  );
}
