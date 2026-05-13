import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/auth";

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/staff", label: "Staff" },
  { href: "/dashboard/availability", label: "Availability" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-white flex flex-col">
        <div className="px-6 py-5 border-b">
          <Link href="/dashboard" className="font-cal text-lg text-primary">
            Dinaya.lk
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t">
          <p className="text-xs text-muted-foreground mb-3 truncate">{session.user?.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-xs text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-muted/20 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
