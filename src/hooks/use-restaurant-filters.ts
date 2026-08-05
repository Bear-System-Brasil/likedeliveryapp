import { useFavoritesStore } from "@/stores";
import { useMemo, useState } from "react";
import { useRestaurants } from "./use-restaurants";
import { useSearchParams } from "next/navigation";
import { Coords, Restaurant } from "@/types/restaurant";

/**
 * Hook para gerenciar filtros e listagem de restaurantes
 */
export const useRestaurantFilters = (userLocation?: Coords) => {
  const { data: restaurants = [], isLoading } = useRestaurants(userLocation);
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();

  // 2. Lemos a categoria direto da URL
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "deliveryTime">("name");

  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];

    if (searchQuery) {
      filtered = filtered.filter(
        (restaurant: Restaurant) =>
          restaurant.tradeName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          restaurant.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }


    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.tradeName.localeCompare(b.tradeName);
        case "rating": return 0;
        case "deliveryTime": return 0;
        default: return 0;
      }
    });

    return filtered;
  }, [restaurants, searchQuery, selectedCategory, sortBy]);

  const favoriteRestaurants = useMemo(() => {
    return restaurants.filter((restaurant: Restaurant) =>
      favorites.includes(restaurant.id),
    );
  }, [restaurants, favorites]);

  return {
    restaurants: filteredRestaurants,
    allRestaurants: restaurants,
    favoriteRestaurants,
    isLoading,
    stats: {
      total: restaurants.length,
      filtered: filteredRestaurants.length,
      favorites: favoriteRestaurants.length,
    },
    searchQuery,
    setSearchQuery,
    selectedCategory, // Retornamos o valor da URL para a página saber qual botão pintar
    sortBy,
    setSortBy,
    favorites,
    isFavorite,
    handleToggleFavorite: toggleFavorite,
  };
};
