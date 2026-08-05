import { getCompanyProducts } from "@/services/products";
import { getRestaurant } from "@/services/restaurant";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para prefetch de dados ao hover
 * Melhora UX carregando dados antes do clique
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Prefetch de dados de restaurante ao hover
   */
  const prefetchRestaurant = (restaurantId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["restaurant", restaurantId],
      queryFn: () => getRestaurant(restaurantId),
      staleTime: 15 * 60 * 1000, // 15 minutos
    });
  };

  /**
   * Prefetch de produtos de um restaurante
   */
  const prefetchRestaurantProducts = (companyId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["products", "company", companyId],
      queryFn: () => getCompanyProducts(companyId!),
      staleTime: 10 * 60 * 1000, // 10 minutos
    });
  };

  /**
   * Prefetch ao hover em card de restaurante
   * Carrega tanto dados do restaurante quanto produtos
   */
  const prefetchRestaurantWithProducts = (restaurantId: string) => {
    prefetchRestaurant(restaurantId);
    prefetchRestaurantProducts(restaurantId);
  };

  return {
    prefetchRestaurant,
    prefetchRestaurantProducts,
    prefetchRestaurantWithProducts,
  };
};
