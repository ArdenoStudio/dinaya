import { auth } from "@/auth";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function StaffPage() {
  const session = await auth();
  const businessId = (session!.user as { businessId: string }).businessId;

  const list = await db.select().from(staff).where(eq(staff.businessId, businessId));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Link href="/dashboard/staff/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Add staff
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          No staff yet.{" "}
          <Link href="/dashboard/staff/new" className="text-primary hover:underline">
            Add your first team member →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.bio && <p className="text-xs text-muted-foreground truncate">{s.bio}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
              <Link href={`/dashboard/staff/${s.id}`} className="text-xs text-primary hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
