"use client";

import { useMemo, useState } from "react";

import { isActiveOrder } from "@/lib/order-status";
import { useUserOrders } from "./use-orders";

type OrderHistoryFilter = "all" | "active" | "completed";

/**
 * Histórico de pedidos do cliente.
 *
 * Antes esta tela lia `/delivery/customer/me`, ou seja, entregas - pedido de
 * retirada ou ainda não despachado nunca aparecia, e o status exibido era o
 * logístico em vez do status do pedido. A fonte correta é `/order/customer/me`.
 */
export function useOrderHistory() {
  const { data: orders = [], isLoading, error, refetch } = useUserOrders();
  const [filter, setFilter] = useState<OrderHistoryFilter>("all");

  const filteredOrders = useMemo(() => {
    if (filter === "active") return orders.filter(isActiveOrder);
    if (filter === "completed") {
      return orders.filter((order) => !isActiveOrder(order));
    }

    return orders;
  }, [filter, orders]);

  return {
    orders: filteredOrders,
    allOrders: orders,
    loading: isLoading,
    error: error ? error.message || "Erro ao carregar seus pedidos" : null,
    filter,
    setFilter,
    refreshHistory: () => {
      refetch();
    },
  };
}
