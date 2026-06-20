import { cn } from "@/lib/utils";

type DotBackgroundProps = {
  className?: string;
  children?: React.ReactNode;
};

/** Aceternity-style CSS dot grid — no WebGL/canvas. */
export function DotBackground({ className, children }: DotBackgroundProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          "[background-image:radial-gradient(hsl(var(--border))_1px,transparent_1px)]",
          "[background-size:20px_20px]",
          "dark:[background-image:radial-gradient(hsl(var(--muted-foreground)/0.25)_1px,transparent_1px)]",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background"
      />
      {children}
    </div>
  );
}
