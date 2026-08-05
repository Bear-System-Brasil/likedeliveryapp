import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getRestaurant } from "@/services/restaurant";
import { getCompanyProducts } from "@/services/products";

import RestaurantInfoPage from "@/components/restaurant-info/restaurant-info";

export default async function RestaurantInfo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["restaurant", id],
      queryFn: () => getRestaurant(id),
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", "company", id],
      queryFn: () => getCompanyProducts(id),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RestaurantInfoPage />
    </HydrationBoundary>
  );
}
