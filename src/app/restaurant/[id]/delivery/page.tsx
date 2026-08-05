import { Delivery } from "@/components/delivery";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <Delivery restaurantId={id} />;
}
