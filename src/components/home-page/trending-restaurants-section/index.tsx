"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  Search,
  ChevronDown,
  Check,
  TrendingUp,
  ArrowDownAZ,
  ArrowUpAZ,
  Star,
  StarOff,
} from "lucide-react";
import { GradientButton } from "@/components/ui/custom";
import { RestaurantGridSkeleton } from "@/components/restaurant-card-skeleton";
import { Restaurant } from "@/components/ui/restaurant";
import { Restaurant as RestaurantType } from "@/types/restaurant";
import { NoRestaurantNear } from "@/components/ui/no-restaurant-near";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption =
  | "default"
  | "name-asc"
  | "name-desc"
  | "rating-desc"
  | "rating-asc";

const sortOptions = [
  {
    value: "default",
    label: "Em alta",
    icon: TrendingUp,
  },
  {
    value: "name-asc",
    label: "Nome A-Z",
    icon: ArrowDownAZ,
  },
  {
    value: "name-desc",
    label: "Nome Z-A",
    icon: ArrowUpAZ,
  },
  {
    value: "rating-desc",
    label: "Melhor avaliação",
    icon: Star,
  },
  {
    value: "rating-asc",
    label: "Pior avaliação",
    icon: StarOff,
  },
] as const;

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
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const hasAnyWithinRadius = trendingRestaurants.some(
    (restaurant) => restaurant.isWithinRadius,
  );

  const sortedRestaurants = useMemo(() => {
    const list = [...trendingRestaurants];

    switch (sortBy) {
      case "name-asc":
        return list.sort((a, b) =>
          (a.tradeName || a.legalName || "").localeCompare(
            b.tradeName || b.legalName || "",
            "pt-BR",
            { sensitivity: "base" },
          ),
        );
      case "name-desc":
        return list.sort((a, b) =>
          (b.tradeName || b.legalName || "").localeCompare(
            a.tradeName || a.legalName || "",
            "pt-BR",
            { sensitivity: "base" },
          ),
        );
      case "rating-desc":
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "rating-asc":
        return list.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
      default:
        return list;
    }
  }, [trendingRestaurants, sortBy]);

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

          {/* Botão único com ícone de filtro + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <GradientButton
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Ordenar</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </GradientButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = sortBy === option.value;

                return (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`
                      flex items-center gap-2.5 cursor-pointer
                      ${isSelected ? "bg-orange-50 text-orange-600 font-medium" : ""}
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-orange-500" : "text-gray-500"
                      }`}
                    />
                    <span className="flex-1">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-orange-500" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!location && <NoRestaurantNear />}

        {loading && !restaurants.length ? (
          <RestaurantGridSkeleton count={6} />
        ) : hasAnyWithinRadius && location ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {sortedRestaurants
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
