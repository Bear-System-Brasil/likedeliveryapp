import { useAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useRestaurantActions = () => {
  const router = useRouter();
  const { showAuthModal } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const navigateToStores = () => {
    router.push("/#lojas");
  };

  const handleToggleFavorite = (restaurantId: string) => {
    setFavorites((prev) =>
      prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId],
    );
  };

  const handleCategoryClick = (categoryName: string) => {
    void categoryName;
    navigateToStores();
  };

  const handleQuickAction = (actionLabel: string) => {
    void actionLabel;
    navigateToStores();
  };

  const handleFindFood = (location: string) => {
    if (!location.trim()) {
      alert("Por favor, digite sua localização");
      return;
    }

    navigateToStores();
  };

  const handleRestaurantClick = (
    restaurantId: string,
    restaurantName?: string,
  ) => {
    void restaurantId;
    void restaurantName;
    navigateToStores();
  };

  const handleCartClick = () => {
    router.push("/cart");
  };

  const handleCheckout = (restaurantId: string) => {
    void restaurantId;
    navigateToStores();
  };

  const handleSignup = () => {
    showAuthModal("register");
  };

  const handleNavigation = (page: string) => {
    const routes: Record<string, string> = {
      home: "/",
      restaurantes: "/#lojas",
      ofertas: "/#lojas",
    };

    const route = routes[page];
    if (route) {
      router.push(route);
    }
  };

  return {
    favorites,
    handleToggleFavorite,
    handleCategoryClick,
    handleQuickAction,
    handleFindFood,
    handleRestaurantClick,
    handleCartClick,
    handleCheckout,
    handleSignup,
    handleNavigation,
  };
};
