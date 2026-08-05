"use client";

import { Sidebar } from "@/components/sidebar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, Order } from "@/services/api";
import { formatCurrency } from "@/utils";
import { useAuthStore } from "@/stores";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

interface CustomerSummary {
  customerId: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastStatus: Order["status"];
}

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "Recebido",
  AWAITING_PAYMENT: "Aguard. Pagamento",
  IN_PRODUCTION: "Em Produção",
  READY_FOR_PICKUP: "Pronto p/ Retirada",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  ABANDONED: "Abandonado",
};

export default function CustomersPage() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["financial", "customers", "orders"],
    queryFn: async () => {
      const response = await apiService.orders.getCompanyOrders();
      if (!response.success || !response.data) return [];
      return response.data;
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const existing = map.get(order.customerId);
      if (!existing) {
        map.set(order.customerId, {
          customerId: order.customerId,
          orderCount: 1,
          totalSpent: order.totalValue,
          lastOrderDate: order.created_at,
          lastStatus: order.status,
        });
      } else {
        const isNewer =
          new Date(order.created_at) > new Date(existing.lastOrderDate);
        map.set(order.customerId, {
          ...existing,
          orderCount: existing.orderCount + 1,
          totalSpent: existing.totalSpent + order.totalValue,
          lastOrderDate: isNewer ? order.created_at : existing.lastOrderDate,
          lastStatus: isNewer ? order.status : existing.lastStatus,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.customerId.toLowerCase().includes(q));
  }, [customers, search]);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar selectedLabel="Clientes" />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Clientes</h1>
            <span className="text-sm text-gray-500">
              {customers.length} cliente{customers.length !== 1 ? "s" : ""}{" "}
              únicos
            </span>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Clientes únicos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {customers.length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Receita total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      customers.reduce((s, c) => s + c.totalSpent, 0),
                    )}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Pedidos totais</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {customers.reduce((s, c) => s + c.orderCount, 0)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID do cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        ID do Cliente
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Pedidos
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Total Gasto
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Ticket Médio
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Último Pedido
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Último Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((customer) => (
                      <tr
                        key={customer.customerId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {customer.customerId.slice(0, 12)}…
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {customer.orderCount}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(
                            customer.totalSpent / customer.orderCount,
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(customer.lastOrderDate).toLocaleString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {STATUS_LABELS[customer.lastStatus] ??
                            customer.lastStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
