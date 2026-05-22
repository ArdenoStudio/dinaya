import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Icon name="shield-x" className="text-2xl text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mb-2 font-cal text-xl tracking-tight">
          Admin page not found
        </h2>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          This admin page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/admin"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Admin Home
          </Link>
          <Link
            href="/admin/accounts"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            View Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}
