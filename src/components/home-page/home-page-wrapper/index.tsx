"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRestaurants, useSyncedUserLocation } from "@/hooks";
import { useCartStore } from "@/stores";
import { useAuth } from "@/contexts/auth-provider";
import { AnimatedBackground } from "@/components/ui/custom";
import { TrendingRestaurantsSection } from "@/components/home-page/trending-restaurants-section";
import { CouponBanner } from "@/components/home-page/coupon-banner";
import { MainHeader } from "@/components/main-header";
import { MobileSearchTrigger } from "@/components/main-header/mobile-search-trigger";
import { Footer } from "@/components/footer";
import { Coords } from "@/types/restaurant";
import { BannerCarousel } from "../banner-carousel";

type LikeDeliveryAppPageProps = {
  initialLocation?: Coords | null;
};

export function LikeDeliveryAppPage({
  initialLocation = null,
}: LikeDeliveryAppPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAuthModal } = useAuth();
  const { getTotalItems } = useCartStore();
  const { location } = useSyncedUserLocation(initialLocation);
  const [visibleCount, setVisibleCount] = useState(4);

  const { data: restaurants = [], isLoading: loadingCompanies } =
    useRestaurants(location);

  const loading = loadingCompanies;

  const handleCartClick = () => {
    router.push("/cart");
  };

  useEffect(() => {
    const openAuth = searchParams.get("openAuth");
    if (openAuth === "true") {
      showAuthModal();
      router.replace("/", { scroll: false });
    }
  }, [searchParams, showAuthModal, router]);

  useEffect(() => {
    if (
      !loading &&
      restaurants.length > 0 &&
      visibleCount < restaurants.length
    ) {
      const timeout = setTimeout(
        () => setVisibleCount(restaurants.length),
        100,
      );
      return () => clearTimeout(timeout);
    }
  }, [loading, restaurants.length, visibleCount]);

  useEffect(() => {
    if (loading) {
      setVisibleCount(4);
    }
  }, [loading]);

  const trendingRestaurants = restaurants.slice(0, 4);

  return (
    <AnimatedBackground
      blobCount={4}
      showBlobs={true}
      className="min-h-screen flex flex-col py-0"
    >
      <MainHeader
        cartItems={getTotalItems()}
        onCartClick={handleCartClick}
        showSearch={true}
        showNav={false}
      />

      <main className="flex-1 flex flex-col pt-24">
        <div className="px-3 pt-1 sm:hidden">
          <MobileSearchTrigger className="w-full" />
        </div>

        <BannerCarousel />

        <TrendingRestaurantsSection
          trendingRestaurants={trendingRestaurants}
          visibleCount={visibleCount}
          restaurants={restaurants}
          loading={loading}
          hasUserLocation={Boolean(location)}
        />

        <Footer />
        <CouponBanner />
      </main>
    </AnimatedBackground>
  );
}
