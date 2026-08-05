import { Heart, Star, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { usePrefetch, useRestaurantActions } from "@/hooks";
import { useFavoritesStore } from "@/stores";
import { Restaurant as RestaurantType } from "@/types/restaurant";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  index: number;
  restaurant: RestaurantType;
};

export function Restaurant({ restaurant, index }: Props) {
  const { handleRestaurantClick, handleCheckout } = useRestaurantActions();
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { prefetchRestaurantWithProducts } = usePrefetch();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleToggleFavorite = (restaurantId: string) => {
    toggleFavorite(restaurantId);
  };

  return (
    <div
      onClick={() => handleRestaurantClick(restaurant.id, restaurant.tradeName)}
      onMouseEnter={() => prefetchRestaurantWithProducts(restaurant.id)}
      className={cn(
        "bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex gap-4 p-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {restaurant.trending && (
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
            {restaurant.discount && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                {restaurant.discount}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
            {restaurant.tradeName}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurant.description}
          </p>

          {/* Rating + Time */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {restaurant.rating}
                </span>
              </div>
            </div>

            {restaurant.time && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">{restaurant.time}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {restaurant.tags && restaurant.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {restaurant.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] sm:text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Delivery Fee */}
          {restaurant.deliveryFee && (
            <div className="text-sm">
              <span className="text-gray-500">Entrega: </span>
              <span
                className={cn(
                  "font-semibold",
                  restaurant.deliveryFee === "Grátis"
                    ? "text-green-600"
                    : "text-gray-900",
                )}
              >
                {restaurant.deliveryFee}
              </span>
            </div>
          )}
        </div>

        {/* Image + Favorite + CTA */}
        <div className="relative flex-shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 relative">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
            )}
            <Image
              width={128}
              height={128}
              src={restaurant.cover_url || "/placeholder.svg"}
              alt={restaurant.tradeName}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0",
              )}
              priority={index < 3}
              loading={index < 3 ? "eager" : "lazy"}
              sizes="128px"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Favorite Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(restaurant.id);
            }}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-50"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                favorites.includes(restaurant.id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400",
              )}
            />
          </Button>

          {/* Ver Cardápio Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCheckout(restaurant.id);
            }}
            className="absolute -bottom-2 -right-2 h-9 px-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 text-xs font-semibold"
          >
            <span className="hidden sm:inline">Ver</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
