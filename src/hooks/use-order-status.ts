import { useSound } from "@/hooks/use-sound";
import { apiService } from "@/services/api";
import {
  getOrderTrackingStatus,
  isCanceledOrder,
  type OrderTrackingStatus,
} from "@/lib/order-status";
import type { SoundName } from "@/lib/sound";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type OrderStatus = OrderTrackingStatus;

/** Intervalo do polling, tambem usado na contagem regressiva exibida na tela. */
const POLL_INTERVAL_SECONDS = 30;

/**
 * Som de cada avanço do pedido. Cada um é um pedaço do motivo da marca, e a
 * frase só fecha em `order-arrived` — o cliente ouve a jornada inteira sendo
 * montada e só ganha a resolução quando a comida chega.
 *
 * `confirmed` não está aqui de propósito: esse som toca no checkout, no clique
 * que finaliza o pedido. Repetir aqui seria tocar duas vezes.
 */
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
  /** Status cru do pedido, como veio da API (ex.: `IN_PRODUCTION`). */
  rawStatus: string;
  isCanceled: boolean;
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

  const { play } = useSound("customer");

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const orderIsFinishedRef = useRef(false);
  /** Ultimo status ja anunciado. `null` = ainda nao vimos o pedido. */
  const announcedStatusRef = useRef<OrderStatus | null>(null);
  const canceledAnnouncedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // Para atualização silenciosa
  const [secondsUntilRefresh, setSecondsUntilRefresh] =
    useState(POLL_INTERVAL_SECONDS);

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

      // `apiRequest` nao lanca em 4xx: sem checar `success` o pedido vinha
      // undefined e a tela quebrava no acesso a `order.id`.
      if (!orderData.success || !orderData.data) {
        throw new Error(
          orderData.message || "Nao foi possivel carregar o pedido",
        );
      }

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

      // O status do rastreio vem do pedido; a entrega so refina o passo entre
      // "pronto" e "a caminho".
      const trackedOrder = { status: order.status, delivery };

      setOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        status: getOrderTrackingStatus(trackedOrder),
        rawStatus: String(order.status ?? ""),
        isCanceled: isCanceledOrder(trackedOrder),
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
      setSecondsUntilRefresh(POLL_INTERVAL_SECONDS);
    }
  };

  useEffect(() => {
    // Pedido entregue ou cancelado nao muda mais - o polling pode parar.
    orderIsFinishedRef.current =
      order?.status === "delivered" || Boolean(order?.isCanceled);
  }, [order?.status, order?.isCanceled]);

  /**
   * Avisa por som quando o pedido anda.
   *
   * So toca em transicao de verdade: a primeira leitura apenas registra o
   * estado. Abrir a tela de um pedido que ja estava em preparo nao e um avanco,
   * e tocar ali ensinaria o cliente a ignorar o som.
   */
  useEffect(() => {
    const status = order?.status;
    if (!status) return;

    const isCanceled = Boolean(order?.isCanceled);
    const previous = announcedStatusRef.current;

    // Primeira leitura: so registra o estado.
    if (previous === null) {
      announcedStatusRef.current = status;
      canceledAnnouncedRef.current = isCanceled;
      return;
    }

    // Cancelamento tem trilha propria porque nao aparece como avanco de status:
    // um pedido cancelado ainda em "confirmed" nao muda `status` nenhum.
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

  /**
   * Auto-fetch e polling
   * - Primeira busca: exibe loading completo
   * - Polling: atualização silenciosa (isRefreshing)
   * - Para de fazer polling em estado final (entregue ou cancelado)
   */
  useEffect(() => {
    // Primeira busca (não silenciosa)
    fetchOrderStatus(false);

    // Poll for updates every 30 seconds (silencioso)
    const pollInterval = setInterval(() => {
      if (orderIsFinishedRef.current) {
        clearInterval(pollInterval);
        return;
      }
      fetchOrderStatus(true); // Silent refresh
    }, POLL_INTERVAL_SECONDS * 1000);

    // Contagem regressiva ate o proximo refresh, exibida na tela.
    const countdown = setInterval(() => {
      if (orderIsFinishedRef.current) return;
      setSecondsUntilRefresh((remaining) =>
        remaining <= 1 ? POLL_INTERVAL_SECONDS : remaining - 1,
      );
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user?.id]);

  return {
    order,
    loading,
    error,
    isRefreshing,
    secondsUntilRefresh,
    /** Forca uma atualizacao sem esperar o proximo ciclo do polling. */
    refresh: () => fetchOrderStatus(true),
    router,
    getStatusMessage,
  };
};
