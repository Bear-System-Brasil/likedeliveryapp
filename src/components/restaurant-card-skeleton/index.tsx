import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton para cards de restaurante
 * Usado durante carregamento inicial para melhor UX
 */
export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-gray-100">
      <div className="relative">
        {/* Image skeleton */}
        <Skeleton className="w-full h-40 sm:h-32 rounded-t-xl" />

        {/* Badges skeleton */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Heart button skeleton */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
        </div>

        {/* Bottom info skeleton */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex gap-2">
          <Skeleton className="h-6 w-12 rounded-full bg-black/20" />
          <Skeleton className="h-6 w-16 rounded-full bg-black/20" />
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Description */}
        <Skeleton className="h-4 w-full" />

        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Grid de skeletons para múltiplos cards
 */
export function RestaurantGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full gap-4 sm:gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <RestaurantCardSkeleton key={index} />
      ))}
    </div>
  );
}
