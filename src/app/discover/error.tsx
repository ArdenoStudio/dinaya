"use client";

export default function DiscoverError() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-cal text-4xl tracking-tight">Directory unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t load the directory right now. Please try again in a moment.
        </p>
      </section>
    </main>
  );
}
