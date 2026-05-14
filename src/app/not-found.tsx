import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <p
            className="font-extrabold text-9xl text-primary select-none"
            style={{
              maskImage: "linear-gradient(to bottom, black 20%, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 80%)",
            }}
          >
            404
          </p>
          <p className="-mt-8 text-foreground/80">
            The page you&apos;re looking for might have been
            <br />
            moved or doesn&apos;t exist.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <i className="bi bi-house text-sm" />
            Go Home
          </Link>

          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <i className="bi bi-compass text-sm" />
            Features
          </Link>
        </div>
      </div>
    </div>
  );
}
