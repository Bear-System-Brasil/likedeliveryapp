"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Filter, Search } from "lucide-react";

import { GradientButton } from "@/components/ui/custom";

import { RestaurantGridSkeleton } from "@/components/restaurant-card-skeleton";

import { Restaurant } from "@/components/ui/restaurant";

import { Restaurant as RestaurantType } from "@/types/restaurant";
import { NoRestaurantNear } from "@/components/ui/no-restaurant-near";

type Props = {
  loading: boolean;
  restaurants: RestaurantType[];
  visibleCount: number;
  trendingRestaurants: RestaurantType[];
};

export function TrendingRestaurantsSection({
  trendingRestaurants,
  visibleCount,
  restaurants,
  loading,
}: Props) {
  const router = useRouter();

  const [location, setLocation] = useState("");

  const hasAnyWithinRadius = trendingRestaurants.some(
    (restaurant) => restaurant.isWithinRadius,
  );

  useEffect(() => {
    const handler = () => {
      const findLocation = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userLocation="));

      const foundLocation = findLocation ? findLocation.split("=")[1] : "";

      if (foundLocation) {
        try {
          const decodedLocation = decodeURIComponent(foundLocation);
          const parsedLocation = JSON.parse(decodedLocation);

          if (
            typeof parsedLocation === "object" &&
            parsedLocation !== null &&
            "lat" in parsedLocation &&
            "lng" in parsedLocation
          ) {
            setLocation(`${parsedLocation.lat}, ${parsedLocation.lng}`);
          } else {
            setLocation(decodedLocation);
          }
        } catch {
          setLocation(foundLocation);
        }
      }
    };

    handler();

    window.addEventListener("locationChanged", handler);

    return () => window.removeEventListener("locationChanged", handler);
  }, []);

  return (
    <section className="px-3 sm:px-4 mb-8 sm:mb-12 md:mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Restaurantes em Alta
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Os mais pedidos da semana
            </p>
          </div>
          <GradientButton
            onClick={() => router.push("/restaurants?view=filters")}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 sm:gap-2"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Filtros</span>
          </GradientButton>
        </div>

        {!location && <NoRestaurantNear />}

        {loading && !restaurants.length ? (
          <RestaurantGridSkeleton count={6} />
        ) : hasAnyWithinRadius && location ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {trendingRestaurants
              .slice(0, visibleCount)
              .map((restaurant, index) => (
                <Restaurant
                  key={restaurant.id}
                  restaurant={restaurant}
                  index={index}
                />
              ))}
          </div>
        ) : (
          location && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum restaurante encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Ainda não há restaurantes perto de você.
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
