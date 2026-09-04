"use client";

/**
 * Motor do sino global: fica de olho em pedidos e chama `notify()` quando
 * algo relevante muda, não importa em qual tela a pessoa está.
 *
 * Cliente e gestão são observados por caminhos diferentes porque hoje só a
 * cozinha tem socket - o resto do app é polling puro (ver
 * `use-order-management.ts` e `use-order-status.ts`):
 *
 * - Cliente: não existe socket de pedido do cliente. Reaproveita
 *   `useUserOrders()` (já usado em /orders, mesmo cache do React Query) e
 *   compara o status de cada pedido a cada refetch.
 * - Gestão: abre sua própria conexão ao namespace `/orders` (o mesmo do
 *   `use-kitchen-orders.ts`) só para alimentar o sino. É uma segunda conexão
 *   quando a pessoa também está com a tela da cozinha aberta, mas mantém este
 *   provider isolado da lógica (já delicada) de tempo real da cozinha.
 */

import { KITCHEN_SOCKET_NAMESPACE, type KitchenOrder } from "@/components/kitchen/types";
import { useAuth } from "@/contexts/auth-provider";
import { useUserOrders } from "@/hooks/use-orders";
import { notify } from "@/lib/notify";
import { getOrderStatusLabel } from "@/lib/order-status";
import type { Order } from "@/services/api";
import { useEffect, useRef, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}${KITCHEN_SOCKET_NAMESPACE}`
  : null;

function orderLabel(order: { id: string; orderNumber?: unknown }) {
  return order.orderNumber ?? order.id.slice(0, 8);
}

function CustomerOrderWatcher() {
  const { data: orders } = useUserOrders();
  // null = ainda não carregou a primeira vez; depois disso vira o snapshot
  // conhecido. Sem essa distinção, a primeira carga notificaria "mudança"
  // pro status que já era o estado inicial de cada pedido.
  const knownStatusRef = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!orders) return;

    const known = knownStatusRef.current;

    if (known === null) {
      knownStatusRef.current = new Map(orders.map((order) => [order.id, order.status]));
      return;
    }

    for (const order of orders as Order[]) {
      const previousStatus = known.get(order.id);
      if (previousStatus !== undefined && previousStatus !== order.status) {
        notify({
          audience: "customer",
          title: `Pedido #${orderLabel(order as unknown as { id: string; orderNumber?: unknown })}`,
          body: getOrderStatusLabel(order),
          href: `/order-status?orderId=${order.id}`,
        });
      }
      known.set(order.id, order.status);
    }
  }, [orders]);

  return null;
}

function ManagementOrderWatcher() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!SOCKET_URL) return;

    let socket: Socket | null = null;
    let cancelled = false;

    fetch("/api/auth/socket-token")
      .then((res) => res.json())
      .then(({ token }: { token: string | null }) => {
        if (cancelled || !token) return;

        socket = io(SOCKET_URL, { auth: { token } });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket!.emit("joinCompanyOrders");
        });

        socket.on("orderCreated", (order: KitchenOrder) => {
          notify({
            audience: "management",
            title: "Novo pedido recebido",
            body: `Pedido #${orderLabel(order)} acabou de chegar.`,
            href: "/order-management",
          });
        });

        socket.on("orderStatusUpdated", (order: KitchenOrder) => {
          if (order.status !== "CANCELED") return;
          notify({
            audience: "management",
            title: "Pedido cancelado",
            body: `O pedido #${orderLabel(order)} foi cancelado.`,
            href: "/order-management",
          });
        });
      });

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return null;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isClient, isRestaurantStaff } = useAuth();

  return (
    <>
      {isAuthenticated && isClient() && <CustomerOrderWatcher />}
      {isAuthenticated && isRestaurantStaff() && <ManagementOrderWatcher />}
      {children}
    </>
  );
}
