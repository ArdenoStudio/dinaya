import { dashboardSectionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

export function SetupWizardSkeleton() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-950">
      <header className="border-b bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
              <div className="h-8 w-24 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
          <div className="h-4 w-16 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-40 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
          <div className="h-8 w-56 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
          <div className="h-4 w-full max-w-md animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
          <div className="mt-4 h-2 animate-pulse motion-reduce:animate-none rounded-full bg-muted" />
        </div>
        <div className={cn(dashboardSectionClass, "space-y-4 px-6 py-8")}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-28 animate-pulse motion-reduce:animate-none rounded-md bg-muted" />
              <div className="h-11 w-full animate-pulse motion-reduce:animate-none rounded-lg bg-muted" />
            </div>
          ))}
          <div className="h-11 w-full animate-pulse motion-reduce:animate-none rounded-lg bg-muted" />
        </div>
      </main>
    </div>
  );
}
