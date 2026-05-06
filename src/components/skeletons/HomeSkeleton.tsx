/**
 * Reusable skeleton loaders for the homepage sections.
 * Uses the existing `skeleton-shimmer` CSS class from index.css.
 */

/** Car card skeleton — mirrors CarCard layout */
export const CarCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
    <div className="aspect-[4/3] w-full skeleton-shimmer" />
    <div className="p-4 space-y-3">
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        <div className="h-6 w-14 rounded-full skeleton-shimmer" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-20 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  </div>
);

/** Horizontal carousel skeleton — 4 cards scrollable */
export const CarouselSkeleton = () => (
  <section className="py-8 sm:py-16 overflow-hidden">
    <div className="container mx-auto px-4 sm:px-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-10">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl skeleton-shimmer flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-64 rounded-lg skeleton-shimmer" />
        </div>
      </div>
      {/* Cards row */}
      <div className="flex gap-4 sm:gap-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px]">
            <CarCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Trust bar skeleton */
export const TrustBarSkeleton = () => (
  <div className="py-4 sm:py-6">
    <div className="container mx-auto px-4 sm:px-6 flex items-center justify-center gap-6 sm:gap-10">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full skeleton-shimmer" />
          <div className="h-4 w-20 sm:w-24 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  </div>
);

/** Why AutoRA section skeleton — 3 pillars */
export const WhyAutoRaSkeleton = () => (
  <section className="py-16 sm:py-32 relative overflow-hidden">
    <div className="container mx-auto px-6 sm:px-8 relative">
      {/* Header — matches WhyAutoRA */}
      <div className="text-center max-w-xl mx-auto mb-10 sm:mb-20 space-y-4">
        <div className="h-8 sm:h-10 w-64 mx-auto rounded-lg skeleton-shimmer" />
        <div className="h-4 w-80 max-w-md mx-auto rounded-lg skeleton-shimmer" />
      </div>
      {/* 4-col bento grid — matches WhyAutoRA layout */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-3xl border border-border/30 bg-card/30 p-6 sm:p-8 space-y-6 flex-shrink-0 w-[240px] sm:w-auto">
            <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
            {i === 1 && <div className="h-12 w-20 rounded-lg skeleton-shimmer" />}
            <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded skeleton-shimmer" />
              <div className="h-3.5 w-5/6 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Testimonials section skeleton */
export const TestimonialsSkeleton = () => (
  <section className="py-16 sm:py-32 relative overflow-hidden">
    <div className="container mx-auto px-6 sm:px-8 relative">
      {/* Header — matches TestimonialsSection */}
      <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16 space-y-4">
        <div className="h-8 sm:h-10 w-72 mx-auto rounded-lg skeleton-shimmer" />
        <div className="h-4 w-96 max-w-md mx-auto rounded-lg skeleton-shimmer" />
      </div>
      {/* 3-col cards — matches TestimonialsSection layout */}
      <div className="flex sm:grid sm:grid-cols-3 gap-5 sm:gap-8 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl border border-border/20 bg-card/30 p-7 sm:p-9 space-y-5 flex-shrink-0 w-[300px] sm:w-auto">
            {/* Quote icon placeholder */}
            <div className="w-8 h-8 rounded skeleton-shimmer" />
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="w-3.5 h-3.5 rounded-sm skeleton-shimmer" />
              ))}
            </div>
            {/* Quote text */}
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded skeleton-shimmer" />
              <div className="h-3.5 w-full rounded skeleton-shimmer" />
              <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
            </div>
            {/* Author */}
            <div className="flex items-center gap-3 pt-3">
              <div className="w-9 h-9 rounded-full skeleton-shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded skeleton-shimmer" />
                <div className="h-3 w-16 rounded skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Brand carousel skeleton — row of circles */
export const BrandCarouselSkeleton = () => (
  <section className="py-6 sm:py-10">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full skeleton-shimmer" />
            <div className="h-3 w-12 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Grid skeleton — for results section */
export const GridSkeleton = () => (
  <div className="flex-1 space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-5 w-32 rounded skeleton-shimmer" />
      <div className="h-9 w-36 rounded-lg skeleton-shimmer" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  </div>
);
