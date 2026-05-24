import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function BookingNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-amber-100">
            <Icon name="shop" className="text-3xl text-amber-600" aria-hidden="true" />
          </div>
        </div>
        <h1 className="mb-2 font-cal text-2xl tracking-tight">
          Business not found
        </h1>
        <p className="mb-8 text-muted-foreground">
          We couldn&apos;t find a booking page at this address. The business may have changed their
          link or the page may no longer exist.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Icon name="house" className="text-sm" aria-hidden="true" />
            Go to Dinaya
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            Create your own page
          </Link>
        </div>
      </div>
    </div>
  );
}
