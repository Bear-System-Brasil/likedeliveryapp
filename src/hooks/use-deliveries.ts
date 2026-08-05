import { apiService } from "@/services";
import { useQuery } from "@tanstack/react-query";

type Props = {
  companyId: string;
};

export const useDeliveries = ({ companyId }: Props) => {
  const deliveries = useQuery({
    queryKey: ["deliveries", companyId],
    queryFn: async () => {
      const response = await apiService.deliveries.getAll();
      if (!response.success || !response.data) {
        throw new Error("Falha ao carregar deliveries");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 5000,
    enabled: !!companyId,
  });

  const filteredItems = deliveries.data?.filter(
    (item) => item.order.companyId === companyId,
  );

  const getDeliveryStatus = (orderId: string) => {
    const order = deliveries.data?.find((item) => item.orderId === orderId);

    return order?.status;
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      const response = await apiService.deliveries.updateStatus(id, status);
      if (response.success && response.data) {
        return response;
      }
    } catch (err) {
      // Error handled silently — UI should show feedback via response state
    }
  };

  return {
    deliveries,
    filteredItems,
    changeStatus,
    getDeliveryStatus,
  };
};
