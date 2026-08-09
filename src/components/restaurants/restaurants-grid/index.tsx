import { useEffect, useState } from "react";

import { Search, Store } from "lucide-react";

import { GradientButton } from "@/components/ui/custom";
import { Restaurant } from "@/components/ui/restaurant";

import { NoRestaurantNear } from "@/components/ui/no-restaurant-near";
import { Button } from "@/components/ui/button";

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
  const shouldShowRestaurants =
    displayedRestaurants.length > 0 && (!location || hasAnyWithinRadius);

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
        ) : shouldShowRestaurants ? (
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
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Store className="h-4 w-4 text-orange-500" />
                Indique um restaurante
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
