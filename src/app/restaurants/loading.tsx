import { Skeleton } from "@/components/ui/skeleton";

import { MainHeader } from "@/components/main-header";
import { RestaurantGridSkeleton } from "@/components/restaurant-card-skeleton";

export default function RestaurantsLoading() {
  return (
    <>
      <MainHeader showSearch={true} showNav={true} />

      <div className="pt-32 pb-16 relative">
        <div className="px-4 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 ">
                <Skeleton className="h-8 w-8" />

                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Todos os Restaurantes
                  </h1>

                  <Skeleton className="w-56 h-4 bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 mb-8">
          <div className="max-w-7xl mx-auto">
            <div
              className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-categories"
              style={{
                minHeight: "64px",
                paddingTop: "8px",
                paddingLeft: "4px",
                paddingRight: "4px",
              }}
            >
              {Array.from({ length: 18 }).map((_, index) => {
                const width = `${4 + Math.random() * 8}%`;
                return (
                  <Skeleton
                    key={index}
                    style={{ width }}
                    className="h-8 whitespace-nowrap shrink-0"
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-4">
          <div className="max-w-7xl mx-auto">
            <RestaurantGridSkeleton count={9} />
          </div>
        </div>
      </div>
    </>
  );
}
