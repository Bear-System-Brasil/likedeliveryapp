import { MainHeader } from "@/components/main-header";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantGridSkeleton } from "@/components/restaurant-card-skeleton";

export default function HomePageLoading() {
  return (
    <>
      <MainHeader showSearch showNav={false} />

      <main className="flex-1 pt-24">
        {/* Banner */}
        <section className="px-4 mt-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-52 md:h-72 rounded-3xl w-full" />
          </div>
        </section>

        {/* Categorias */}
        <section className="px-4 mt-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-5 w-20" />
            </div>

            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-11 w-28 rounded-2xl shrink-0"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Restaurantes */}
        <section className="px-4 mt-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>

            <RestaurantGridSkeleton count={6} />
          </div>
        </section>

        {/* Cupom */}
        <section className="px-4 mt-10 mb-12">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-32 rounded-3xl w-full" />
          </div>
        </section>
      </main>
    </>
  );
}
