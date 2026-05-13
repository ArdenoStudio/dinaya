import { auth } from "@/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { formatLkr } from "@/lib/utils";

export default async function ServicesPage() {
  const session = await auth();
  const businessId = (session!.user as { businessId: string }).businessId;

  const list = await db
    .select()
    .from(services)
    .where(eq(services.businessId, businessId))
    .orderBy(services.createdAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cal text-2xl">Services</h1>
        <Link
          href="/dashboard/services/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + Add service
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          No services yet.{" "}
          <Link href="/dashboard/services/new" className="text-primary hover:underline">
            Add your first service →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {s.durationMinutes} min
                  {s.priceLkr > 0 ? ` · ${formatLkr(s.priceLkr)}` : " · Free"}
                  {s.requiresPayment ? " · Payment required" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/dashboard/services/${s.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
