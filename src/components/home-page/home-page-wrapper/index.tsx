"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useCartStore } from "@/stores";

import { useRestaurantActions, useRestaurants } from "@/hooks";
import { useAuth } from "@/contexts/auth-provider";

import { RESTAURANT_CATEGORIES } from "@/constants";

import { AnimatedBackground } from "@/components/ui/custom";

import { TrendingRestaurantsSection } from "@/components/home-page/trending-restaurants-section";

import { CouponBanner } from "@/components/home-page/coupon-banner";
import { MainHeader } from "@/components/main-header";
import { Footer } from "@/components/footer";

import { Coords, Restaurant } from "@/types/restaurant";
import { BottomBar } from "@/components/ui/bottom-bar";
import { CategoriesFilter } from "@/components/categories-filter";
import { BannerCarousel } from "../banner-carousel";

export function LikeDeliveryAppPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { showAuthModal } = useAuth();
  const { getTotalItems } = useCartStore();

  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const [location, setLocation] = useState<Coords>();

  const featuredCategories = RESTAURANT_CATEGORIES;

  // State for progressive rendering (batched rendering)
  const [visibleCount, setVisibleCount] = useState(3);

  const { data: restaurants = [], isLoading: loadingCompanies } =
    useRestaurants(location);

  const loading = loadingCompanies;

  const { handleCategoryClick, handleQuickAction, handleCartClick } =
    useRestaurantActions();

  useEffect(() => {
    // Check if auth modal should be opened
    const openAuth = searchParams.get("openAuth");
    if (openAuth === "true") {
      showAuthModal();
      // Remove URL parameter without page reload
      router.replace("/", { scroll: false });
    }
  }, [searchParams, showAuthModal, router]);

  // Scroll handlers for categories carousel
  const scrollCategories = (direction: "left" | "right") => {
    if (!categoriesScrollRef.current) return;
    const scrollAmount = 300;
    const newScrollLeft =
      categoriesScrollRef.current.scrollLeft +
      (direction === "right" ? scrollAmount : -scrollAmount);
    categoriesScrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  const checkScrollPosition = () => {
    if (!categoriesScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } =
      categoriesScrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const scrollContainer = categoriesScrollRef.current;
    if (scrollContainer) {
      checkScrollPosition();
      scrollContainer.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [featuredCategories]);

  // Progressive rendering - show restaurants in batches for better UX
  // Similar to Instagram/iFood progressive content loading
  useEffect(() => {
    if (
      !loading &&
      restaurants.length > 0 &&
      visibleCount < restaurants.length
    ) {
      // First show 3, then 6, then all
      const timeouts: NodeJS.Timeout[] = [];

      if (visibleCount === 3) {
        timeouts.push(setTimeout(() => setVisibleCount(6), 100));
      }
      if (visibleCount === 6) {
        timeouts.push(
          setTimeout(() => setVisibleCount(restaurants.length), 100),
        );
      }

      return () => timeouts.forEach((t) => clearTimeout(t));
    }
  }, [loading, restaurants.length, visibleCount]);

  // Reset visible count when starting new load
  useEffect(() => {
    if (loading) {
      setVisibleCount(3);
    }
  }, [loading]);

  useEffect(() => {
    const syncLocationFromCookie = () => {
      const findLocation = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userLocation="));

      const foundLocation = findLocation ? findLocation.split("=")[1] : "";

      if (!foundLocation) return;

      try {
        const decodedLocation = decodeURIComponent(foundLocation);
        const parsedLocation = JSON.parse(decodedLocation);

        if (
          typeof parsedLocation === "object" &&
          parsedLocation !== null &&
          "lat" in parsedLocation &&
          "lng" in parsedLocation
        ) {
          setLocation({
            lat: parsedLocation.lat,
            lng: parsedLocation.lng,
          });
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("erro ao parsear localizacao:", err.message);
        }
      }
    };

    syncLocationFromCookie();

    window.addEventListener("locationChanged", syncLocationFromCookie);

    return () => {
      window.removeEventListener("locationChanged", syncLocationFromCookie);
    };
  }, []);

  // Convert companies to restaurant display format
  const trendingRestaurants: Restaurant[] = restaurants.slice(0, 6);

  return (
    <AnimatedBackground
      blobCount={4}
      showBlobs={true}
      className="min-h-screen flex flex-col"
    >
      <MainHeader
        cartItems={getTotalItems()}
        onCartClick={handleCartClick}
        showSearch={true}
        showNav={false}
      />

      <main className="flex-1 flex flex-col pt-24">
        <BannerCarousel />
        <CategoriesFilter
          title="Categorias Populares"
          categories={featuredCategories}
          selectedValue={selectedCategory}
          onSelect={(value) => {
            setSelectedCategory(value);
            handleCategoryClick(value ?? "Todos");
          }}
          showArrows
          categoriesScrollRef={categoriesScrollRef}
          scrollCategories={scrollCategories}
          rightContent={
            <button
              onClick={() => router.push("/restaurants")}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              Ver Todas →
            </button>
          }
        />

        <TrendingRestaurantsSection
          trendingRestaurants={trendingRestaurants}
          visibleCount={visibleCount}
          restaurants={restaurants}
          loading={loading}
        />
        <Footer />
        <CouponBanner />
      </main>

      <BottomBar activeTab="home" />
    </AnimatedBackground>
  );
}
