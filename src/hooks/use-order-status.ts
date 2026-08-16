import { useSound } from "@/hooks/use-sound";
import { apiService } from "@/services/api";
import {
  getOrderTrackingStatus,
  isCanceledOrder,
  type OrderTrackingStatus,
} from "@/lib/order-status";
import type { SoundName } from "@/lib/sound";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type OrderStatus = OrderTrackingStatus;

const POLL_INTERVAL_MS = 30_000;

const STATUS_SOUNDS: Partial<Record<OrderStatus, SoundName>> = {
  preparing: "step-preparing",
  ready: "step-ready",
  delivering: "step-on-the-way",
  delivered: "order-arrived",
};

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
  rawStatus: string;
  isCanceled: boolean;
}

async function fetchOrderData(
  orderId: string,
  userId: string,
  userName?: string,
  userPhone?: string,
): Promise<OrderInfo> {
  const orderData = await apiService.orders.viewOrder(userId, orderId);

  if (!orderData.success || !orderData.data) {
    throw new Error(orderData.message || "Não foi possível carregar o pedido");
  }

  const orderItemsData = await apiService.orderItems.listByOrder(
    orderId,
    userId,
  );

  let delivery: any = null;
  try {
    const allDeliveries = await apiService.deliveries.getCustomerDeliveries();
    const deliveries = (allDeliveries.data as any) || [];
    delivery = deliveries.find((d: any) => d.orderId === orderId) ?? null;
  } catch {
    // silencioso
  }

  const items = (orderItemsData as any)?.data || [];
  const order = orderData.data as any;

  let fullAddress = "Endereço não disponível";

  if (delivery?.deliveryAddressId) {
    try {
      const address = delivery.deliveryAddress;
      if (address && typeof address === "object") {
        fullAddress = `${address.street}, ${address.number}${
          address.complement ? ", " + address.complement : ""
        } - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zipCode}`;
      } else {
        const addressResponse = await apiService.address.getUserAddresses();
        const userAddress = (addressResponse.data as any)?.find(
          (addr: any) => addr.id === delivery.deliveryAddressId,
        );
        if (userAddress) {
          fullAddress = `${userAddress.street}, ${userAddress.number}${
            userAddress.complement ? ", " + userAddress.complement : ""
          } - ${userAddress.neighborhood}, ${userAddress.city}/${userAddress.state} - CEP: ${userAddress.zipCode}`;
        }
      }
    } catch {
      fullAddress = "Endereço não disponível";
    }
  } else if (typeof delivery?.deliveryAddress === "string") {
    fullAddress = delivery.deliveryAddress;
  }

  const trackedOrder = { status: order.status, delivery };

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: getOrderTrackingStatus(trackedOrder),
    rawStatus: String(order.status ?? ""),
    isCanceled: isCanceledOrder(trackedOrder),
    estimatedTime:
      delivery?.estimatedDeliveryTime || delivery?.estimatedTime || "30-40 min",
    total: order.totalValue || order.total || 0,
    items: items.map((item: any) => ({
      name: item.product?.name || "Item",
      quantity: item.quantity || 1,
      price:
        item.unitPrice || item.product?.salePrice || item.product?.price || 0,
    })),
    customerInfo: {
      name: userName || "Cliente",
      address: fullAddress,
      phone: userPhone || "Telefone não disponível",
    },
    delivery,
  };
}

/**
 * Hook para rastrear status de pedido
 * Agora com TanStack Query (cache + polling inteligente)
 */
export const useOrderStatus = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get("orderId");
  const { user } = useAuthStore();
  const { play } = useSound("customer");
  const queryClient = useQueryClient();

  const announcedStatusRef = useRef<OrderStatus | null>(null);
  const canceledAnnouncedRef = useRef(false);

  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    POLL_INTERVAL_MS / 1000,
  );

  const {
    data: order,
    isLoading: loading,
    isFetching: isRefreshing,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["order-status", orderId, user?.id],
    queryFn: () => fetchOrderData(orderId!, user!.id, user?.name, user?.phone),
    enabled: Boolean(orderId && user?.id),
    staleTime: 10_000, // 10s — evita refetch imediato ao remontar
    gcTime: 5 * 60_000, // 5 min na memória
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Para o polling quando o pedido já terminou
      if (data?.status === "delivered" || data?.isCanceled) {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false, // economiza bateria
  });

  const error = queryError
    ? (queryError as Error).message
    : !orderId
      ? "OrderId não encontrado na URL"
      : !user?.id
        ? "Usuário não autenticado"
        : null;

  // Contagem regressiva visual
  useEffect(() => {
    if (!order || order.status === "delivered" || order.isCanceled) {
      return;
    }

    const tick = setInterval(() => {
      const elapsed = Date.now() - dataUpdatedAt;
      const remaining = Math.max(
        0,
        Math.ceil((POLL_INTERVAL_MS - elapsed) / 1000),
      );
      setSecondsUntilRefresh(remaining || POLL_INTERVAL_MS / 1000);
    }, 1000);

    return () => clearInterval(tick);
  }, [dataUpdatedAt, order?.status, order?.isCanceled]);

  // Sons de avanço de status (mesma lógica de antes)
  useEffect(() => {
    const status = order?.status;
    if (!status) return;

    const isCanceled = Boolean(order?.isCanceled);
    const previous = announcedStatusRef.current;

    if (previous === null) {
      announcedStatusRef.current = status;
      canceledAnnouncedRef.current = isCanceled;
      return;
    }

    if (isCanceled) {
      if (!canceledAnnouncedRef.current) {
        canceledAnnouncedRef.current = true;
        play("error");
      }
      return;
    }

    if (previous === status) return;

    announcedStatusRef.current = status;
    const sound = STATUS_SOUNDS[status];
    if (sound) play(sound);
  }, [order?.status, order?.isCanceled, play]);

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

  return {
    order: order ?? null,
    loading,
    error,
    isRefreshing, // true só quando está refetchando em background
    secondsUntilRefresh,
    refresh: () => refetch(),
    router,
    getStatusMessage,
  };
};
