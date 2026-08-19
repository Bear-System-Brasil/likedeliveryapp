"use client";

import { useRouter } from "next/navigation";

import { useProfileManagement } from "@/hooks";
import { useDeliveries } from "@/hooks/use-deliveries";
import { Skeleton } from "../ui/skeleton";
import { DeliveryList } from "./delivery-list";

type Props = {
  restaurantId: string;
};

export function Delivery({ restaurantId }: Props) {
  const router = useRouter();

  const { user, isMounted, isAuthenticated } = useProfileManagement();
  const { filteredItems } = useDeliveries({ companyId: restaurantId });

  // Prevent rendering during SSR/SSG
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.push("/cart");
    return null;
  }

  return (
    <section className="mx-auto w-full">
      <div className="flex items-center justify-center">
        {filteredItems && (
          <div className="max-w-lg md:max-w-full w-full min-h-96 h-full overflow-y-scroll">
            <DeliveryList items={filteredItems} />
          </div>
        )}
      </div>
    </section>
  );
}
