import { useAuthStore } from "@/stores";
import { isCompanyRole } from "@/utils/role-helpers";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useNavigation() {
  const router = useRouter();
  const { user } = useAuthStore();

  const navigateToStores = useCallback(() => {
    router.push("/#lojas");
  }, [router]);

  const navigateToHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const navigateToRestaurants = useCallback(() => {
    navigateToStores();
  }, [navigateToStores]);

  const navigateToOffers = useCallback(() => {
    navigateToStores();
  }, [navigateToStores]);

  const navigateToCart = useCallback(() => {
    router.push("/cart");
  }, [router]);

  const navigateToProfile = useCallback(() => {
    if (isCompanyRole(user?.role)) {
      router.push("/company-profile");
    } else {
      router.push("/profile");
    }
  }, [router, user]);

  const navigateToRestaurant = useCallback(
    (restaurantId: number, restaurantName?: string) => {
      void restaurantId;
      void restaurantName;
      navigateToStores();
    },
    [navigateToStores],
  );

  const navigateToCategory = useCallback(
    (categoryName: string) => {
      void categoryName;
      navigateToStores();
    },
    [navigateToStores],
  );

  const navigateToFilter = useCallback(
    (filterLabel: string) => {
      void filterLabel;
      navigateToStores();
    },
    [navigateToStores],
  );

  const navigateToRestaurantsWithFilters = useCallback(() => {
    navigateToStores();
  }, [navigateToStores]);

  const navigateToLocation = useCallback(
    (location: string) => {
      if (!location.trim()) {
        return false;
      }

      navigateToStores();
      return true;
    },
    [navigateToStores],
  );

  return {
    navigateToHome,
    navigateToRestaurants,
    navigateToOffers,
    navigateToCart,
    navigateToProfile,
    navigateToRestaurant,
    navigateToCategory,
    navigateToFilter,
    navigateToRestaurantsWithFilters,
    navigateToLocation,
  };
}
