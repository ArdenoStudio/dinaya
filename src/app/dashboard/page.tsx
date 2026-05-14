import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, businesses } from "@/db/schema";
import { eq, gte, count, and, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek, format } from "date-fns";
import Link from "next/link";
import {
  CalendarDays,
  BookOpen,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Scissors,
  Link2,
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

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const useSubdomain = appDomain === "dinaya.lk";
  const bookingUrl = useSubdomain
    ? `https://${business.slug}.dinaya.lk`
    : `${appUrl}/book/${business.slug}`;
  const bookingDisplayUrl = useSubdomain
    ? `${business.slug}.dinaya.lk`
    : `${appUrl.replace(/^https?:\/\//, "")}/book/${business.slug}`;

  const stats = [
    {
      label: "Bookings this week",
      value: bookingsThisWeek,
      icon: CalendarDays,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      accent: "bg-primary",
    },
    {
      label: "Total bookings",
      value: totalBookings,
      icon: BookOpen,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      accent: "bg-emerald-500",
    },
    {
      label: "Current plan",
      value: business.plan.charAt(0).toUpperCase() + business.plan.slice(1),
      icon: Sparkles,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      accent: "bg-amber-500",
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/bookings",
      label: "View all bookings",
      description: "See your full schedule",
      icon: BookOpen,
    },
    {
      href: "/dashboard/services",
      label: "Manage services",
      description: "Edit your offerings",
      icon: Scissors,
    },
    {
      href: "/dashboard/calendar",
      label: "Open calendar",
      description: "Browse by date",
      icon: CalendarDays,
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-2">
          {format(now, "EEEE, MMMM d")}
        </p>
        <h1 className="font-cal text-3xl tracking-tight">
          Good day, {business.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening with {business.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl overflow-hidden">
            <div className={`h-[3px] w-full ${s.accent}`} />
            <div className="p-5 flex items-start gap-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${s.iconBg}`}
              >
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-0.5 tracking-tight">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking link */}
      <div className="bg-primary/[0.04] border border-primary/15 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Link2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Your booking page</p>
        </div>
        <div className="flex items-center gap-2.5">
          <code className="text-primary text-sm bg-white px-3 py-2 rounded-lg flex-1 truncate border border-primary/15 font-mono tracking-tight">
            {bookingDisplayUrl}
          </code>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary bg-white border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors whitespace-nowrap shrink-0"
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
            className="flex items-center justify-between bg-white border rounded-xl px-4 py-4 hover:border-primary/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <a.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm leading-tight">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  );
}
