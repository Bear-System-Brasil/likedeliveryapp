import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered";

export interface OrderInfo {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  estimatedTime: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
  };
  delivery?: any;
}

/**
 * Hook para rastrear status de pedido
 * Inclui: fetch de pedido, polling a cada 30s, mapeamento de status
 */
export const useOrderStatus = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get("orderId");
  const { user } = useAuthStore();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const orderStatusRef = useRef<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // Para atualização silenciosa

  /**
   * Mapeia status do backend para frontend
   */
  const mapStatus = (backendStatus: string): OrderStatus => {
    const statusMap: Record<string, OrderStatus> = {
      confirmed: "confirmed",
      pending: "confirmed",
      preparing: "preparing",
      ready: "ready",
      out_for_delivery: "delivering",
      in_transit: "delivering",
      delivered: "delivered",
      completed: "delivered",
    };
    return statusMap[backendStatus.toLowerCase()] || "confirmed";
  };

  /**
   * Retorna mensagem descritiva para cada status
   */
  const getStatusMessage = (status: OrderStatus): string => {
    const messages = {
      confirmed: "Pedido confirmado! Estamos preparando com carinho.",
      preparing: "Seu pedido está sendo preparado na cozinha.",
      ready: "Pedido pronto! Saindo para entrega.",
      delivering: "Pedido a caminho! Chegando em breve.",
      delivered: "Pedido entregue! Esperamos que tenha gostado!",
    };
    return messages[status];
  };

  /**
   * Busca dados do pedido
   * @param silent - Se true, usa isRefreshing ao invés de loading (para polling em background)
   */
  const fetchOrderStatus = async (silent = false) => {
    if (!orderId || !user?.id) {
      const errorMsg = !orderId
        ? "OrderId não encontrado na URL"
        : "Usuário não autenticado";
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      // Se for atualização silenciosa, usa isRefreshing
      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const orderData = await apiService.orders.viewOrder(user.id, orderId);
      const orderItemsData = await apiService.orderItems.listByOrder(
        orderId,
        user.id,
      );

      let deliveryData = null;
      try {
        const allDeliveries =
          await apiService.deliveries.getCustomerDeliveries();
        const deliveries = (allDeliveries.data as any) || [];
        const matchingDelivery = deliveries.find(
          (d: any) => d.orderId === orderId,
        );

        if (matchingDelivery) {
          deliveryData = { data: matchingDelivery };
        }
      } catch (err) {
        // Ignora erro silenciosamente
      }

      const delivery = deliveryData?.data as any;
      const items = (orderItemsData as any)?.data || [];
      const order = orderData.data as any;

      let fullAddress = "Endereço não disponível";
      if (delivery?.deliveryAddressId) {
        try {
          const address = delivery.deliveryAddress;
          if (address && typeof address === "object") {
            fullAddress = `${address.street}, ${address.number}${address.complement ? ", " + address.complement : ""} - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zipCode}`;
          } else {
            const addressResponse = await apiService.address.getUserAddresses();
            const userAddress = (addressResponse.data as any)?.find(
              (addr: any) => addr.id === delivery.deliveryAddressId,
            );

            if (userAddress) {
              fullAddress = `${userAddress.street}, ${userAddress.number}${userAddress.complement ? ", " + userAddress.complement : ""} - ${userAddress.neighborhood}, ${userAddress.city}/${userAddress.state} - CEP: ${userAddress.zipCode}`;
            }
          }
        } catch (err) {
          fullAddress = "Endereço não disponível";
        }
      } else if (typeof delivery?.deliveryAddress === "string") {
        fullAddress = delivery.deliveryAddress;
      }

      setOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        status: mapStatus(order.status || "confirmed"),
        estimatedTime:
          delivery?.estimatedDeliveryTime ||
          delivery?.estimatedTime ||
          "30-40 min",
        total: order.totalValue || order.total || 0,
        items: items.map((item: any) => ({
          name: item.product?.name || "Item",
          quantity: item.quantity || 1,
          price:
            item.unitPrice ||
            item.product?.salePrice ||
            item.product?.price ||
            0,
        })),
        customerInfo: {
          name: user.name || "Cliente",
          address: fullAddress,
          phone: user.phone || "Telefone não disponível",
        },
        delivery: delivery,
      });

      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    } catch (err: any) {
      // Só atualiza erro se não for silent (evita mostrar erro durante polling)
      if (!silent) {
        setError(err.message || "Erro ao carregar status do pedido");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    orderStatusRef.current = order?.status ?? null;
  }, [order?.status]);

  /**
   * Auto-fetch e polling
   * - Primeira busca: exibe loading completo
   * - Polling: atualização silenciosa (isRefreshing)
   * - Para de fazer polling quando pedido for entregue
   */
  useEffect(() => {
    // Primeira busca (não silenciosa)
    fetchOrderStatus(false);

    // Poll for updates every 30 seconds (silencioso)
    const pollInterval = setInterval(() => {
      // Parar polling se pedido já foi entregue
      if (orderStatusRef.current === "delivered") {
        clearInterval(pollInterval);
        return;
      }
      fetchOrderStatus(true); // Silent refresh
    }, 30000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user?.id]);

  return {
    order,
    loading,
    error,
    isRefreshing,
    router,
    getStatusMessage,
  };
};
