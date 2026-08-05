import { cookies } from "next/headers";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getActiveRestaurants } from "@/services/restaurants";

import { LikeDeliveryAppPage } from "@/components/home-page/home-page-wrapper";

export default async function LikeDeliveryApp() {
  const queryClient = new QueryClient();

  const cookieStore = await cookies();

  const raw = cookieStore.get("userLocation")?.value;

  let userLocation = null;

  try {
    userLocation = raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.log("Erro ao parsear cookie: ", err);
  }

  await queryClient.prefetchQuery({
    queryKey: ["restaurants", "active", userLocation],
    queryFn: () => getActiveRestaurants(userLocation),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LikeDeliveryAppPage />
    </HydrationBoundary>
  );
}
