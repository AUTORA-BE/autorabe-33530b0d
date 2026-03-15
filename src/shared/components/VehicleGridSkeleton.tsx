/**
 * Skeleton loading state for the vehicle grid
 * @module shared/components/VehicleGridSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';

interface VehicleGridSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
}

/**
 * Premium skeleton loader matching VehicleCard layout
 */
export function VehicleGridSkeleton({ count = 6 }: VehicleGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl overflow-hidden border border-border/50"
        >
          {/* Image placeholder */}
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          {/* Content */}
          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-3/5 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-2/5 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VehicleGridSkeleton;
