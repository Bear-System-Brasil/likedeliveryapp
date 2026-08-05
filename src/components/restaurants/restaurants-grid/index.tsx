import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { GradientButton } from "@/components/ui/custom";
import { Restaurant } from "@/components/ui/restaurant";

import { NoRestaurantNear } from "@/components/ui/no-restaurant-near";

import { RestaurantGridSkeleton } from "@/components/restaurant-card-skeleton";

import { Restaurant as RestaurantType } from "@/types/restaurant";

type Props = {
  isLoading: boolean;
  displayedRestaurants: RestaurantType[];
  handleCategoryFilter: (val: string | null) => void;
};

export function RestaurantsGrid({
  handleCategoryFilter,
  displayedRestaurants,
  isLoading,
}: Props) {
  const [location, setLocation] = useState("");

  const hasAnyWithinRadius = displayedRestaurants.some(
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
    <div className="px-4">
      <div className="max-w-7xl mx-auto">
        {!location && <NoRestaurantNear />}

        {isLoading ? (
          <RestaurantGridSkeleton count={9} />
        ) : hasAnyWithinRadius && location ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedRestaurants.map((restaurant, index) => (
                <Restaurant
                  key={restaurant.id}
                  restaurant={restaurant}
                  index={index}
                />
              ))}
            </div>
            {/* Empty State */}
            {displayedRestaurants.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum restaurante encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar os filtros ou buscar por outro termo
                </p>
                <GradientButton
                  onClick={() => handleCategoryFilter(null)}
                  size="lg"
                >
                  Ver Todos os Restaurantes
                </GradientButton>
              </div>
            )}
          </>
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
    </div>
  );
}
