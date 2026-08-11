"use client";

import { useRouter } from "next/navigation";

import { BackButton } from "@/components/back-button";

import { Restaurant } from "@/types/restaurant";

type Props = {
  displayedRestaurants: Restaurant[];
};

export function RestaurantsPageHeader({ displayedRestaurants }: Props) {
  const router = useRouter();

  const countWithinRadius = displayedRestaurants.filter(
    (restaurant) => restaurant.isWithinRadius !== false,
  );

  return (
    <div className="px-4 mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton onClick={() => router.push("/")} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Todos os Restaurantes
              </h1>
              <p className="text-gray-600">
                {countWithinRadius.length} restaurante
                {countWithinRadius.length !== 1 ? "s" : ""} encontrado
                {countWithinRadius.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
