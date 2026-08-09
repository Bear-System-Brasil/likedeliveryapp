import { Suspense } from "react";

import { RestaurantsWrapper } from "@/components/restaurants/restaurants-wrapper";

export default function Restaurants() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white pt-32 text-center text-sm font-semibold text-gray-500">
          Carregando restaurantes...
        </main>
      }
    >
      <RestaurantsWrapper />
    </Suspense>
  );
}
