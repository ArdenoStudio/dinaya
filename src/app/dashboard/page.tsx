import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, businesses } from "@/db/schema";
import { eq, gte, count, and, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import {
  CalendarDays,
  BookOpen,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Scissors,
} from "lucide-react";

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

  const stats = [
    {
      label: "Bookings this week",
      value: bookingsThisWeek,
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total bookings",
      value: totalBookings,
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Plan",
      value: business.plan.charAt(0).toUpperCase() + business.plan.slice(1),
      icon: Sparkles,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const quickActions = [
    { href: "/dashboard/bookings", label: "View all bookings", icon: BookOpen },
    { href: "/dashboard/services", label: "Manage services", icon: Scissors },
    { href: "/dashboard/calendar", label: "Open calendar", icon: CalendarDays },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cal text-2xl">Good day, {business.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with {business.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-5 flex items-start gap-4">
            <div className={`mt-0.5 flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${s.bg}`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
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
            className="flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap"
          >
            Open <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center justify-between bg-white border rounded-lg px-4 py-3.5 hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <a.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-medium text-sm">{a.label}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
