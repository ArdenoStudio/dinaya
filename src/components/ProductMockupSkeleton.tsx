/** Placeholder while ProductMockup chunk loads — height matches demo section to limit CLS */
export function ProductMockupSkeleton() {
  return (
    <section
      className="max-w-5xl mx-auto px-6 pb-16"
      aria-hidden="true"
    >
      <div className="mx-auto aspect-video rounded-2xl bg-gray-100/90 animate-pulse ring-1 ring-gray-200/80" />
    </section>
  );
}
