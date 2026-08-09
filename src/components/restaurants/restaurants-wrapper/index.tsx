"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores";
import {
  useCategories,
  useRestaurantFilters,
  useSyncedUserLocation,
} from "@/hooks";
import { RESTAURANT_CATEGORIES } from "@/constants";
import { AnimatedBackground } from "@/components/ui/custom";
import { RestaurantsPageHeader } from "@/components/restaurants/restaurants-page-header";
import { RestaurantsGrid } from "@/components/restaurants/restaurants-grid";
import { MainHeader } from "@/components/main-header";
import AuthModal from "@/components/auth-modal";
import { Footer } from "@/components/footer";
import { Coords } from "@/types/restaurant";
import { CategoriesFilter } from "@/components/categories-filter";

type Props = {
  userLocation?: Coords | null;
};

export function RestaurantsWrapper({ userLocation }: Props) {
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const { location: activeLocation } = useSyncedUserLocation(userLocation);
  const { restaurants: filteredRestaurants, isLoading } =
    useRestaurantFilters(activeLocation);
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);

  const searchParams = useSearchParams();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    setSelectedCategoryName(categoryFromUrl ?? null);
  }, [searchParams]);

  const handleCartClick = () => {
    router.push("/cart");
  };

  const categories = [
    { id: null, name: "Todos" },
    ...RESTAURANT_CATEGORIES.map((cat) => ({
      id: cat.name,
      name: cat.name,
    })),
  ];

  const handleCategoryFilter = (categoryName: string | null) => {
    setSelectedCategoryName(categoryName);
    if (categoryName) {
      router.push(`/?category=${encodeURIComponent(categoryName)}#lojas`);
    } else {
      router.push("/#lojas");
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (!categoriesScrollRef.current) return;

    const scrollAmount = 280;
    categoriesScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const displayedRestaurants = useMemo(() => {
    if (!selectedCategoryName) return filteredRestaurants;
    if (!categoriesData || isCategoriesLoading || categoriesError) {
      return filteredRestaurants;
    }

    const validCompanyIds = categoriesData
      .filter((cat) => cat.name === selectedCategoryName)
      .map((cat) => cat.companyId);

    return filteredRestaurants.filter((restaurant) =>
      validCompanyIds.includes(restaurant.id),
    );
  }, [
    filteredRestaurants,
    selectedCategoryName,
    categoriesData,
    isCategoriesLoading,
    categoriesError,
  ]);

  return (
    <>
      <AnimatedBackground blobCount={3} showBlobs={true}>
        <MainHeader
          cartItems={getTotalItems()}
          onCartClick={handleCartClick}
          showSearch={true}
          showNav={true}
        />

        <main className="pt-32 pb-16 relative">
          {/* Page Header */}
          <RestaurantsPageHeader displayedRestaurants={displayedRestaurants} />

          {/* Category Filters */}
          <CategoriesFilter
            categories={categories}
            selectedValue={selectedCategoryName}
            onSelect={handleCategoryFilter}
            showAllOption={false}
            showArrows
            categoriesScrollRef={categoriesScrollRef}
            scrollCategories={scrollCategories}
          />

          {/* Restaurants Grid */}
          <RestaurantsGrid
            handleCategoryFilter={handleCategoryFilter}
            displayedRestaurants={displayedRestaurants}
            isLoading={isLoading}
          />
        </main>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </AnimatedBackground>

      <Footer />
    </>
  );
}
