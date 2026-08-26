"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, MAX_PAGE_LIMIT, Order } from "@/services/api";
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
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["financial", "customers", "orders"],
    queryFn: async () => {
      // Essa tela agrega gasto/pedidos por cliente sobre a base inteira -
      // não dá pra paginar de verdade sem falsear o total. Percorre todas as
      // páginas (limite máximo por chamada) em vez de um fetch único sem
      // limite como antes.
      const allOrders: Order[] = [];
      let page = 1;
      while (true) {
        const response = await apiService.orders.getCompanyOrders({
          page,
          limit: MAX_PAGE_LIMIT,
        });
        if (!response.success || !response.data) break;
        allOrders.push(...response.data.data);
        if (page >= response.data.meta.totalPages) break;
        page += 1;
      }
      return allOrders;
    },
    enabled: !!isAuthenticated,
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
    <AdminPageLayout
      title="Clientes"
      icon={Users}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-64 lg:pr-8"
      actions={
        <span className="rounded-[8px] border border-[#E9EAEE] bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#3D4149]">
          {customers.length} cliente{customers.length !== 1 ? "s" : ""} únicos
        </span>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
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
          <div className="relative w-full sm:w-64">
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
              <>
                {/* Mobile: lista em cards */}
                <div className="divide-y divide-gray-100 md:hidden">
                  {filtered.map((customer) => (
                    <div key={customer.customerId} className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate font-mono text-xs text-gray-500">
                          {customer.customerId.slice(0, 12)}…
                        </p>
                        <span className="shrink-0 text-xs text-gray-500">
                          {customer.orderCount} pedido
                          {customer.orderCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-700">
                            {formatCurrency(customer.totalSpent)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ticket médio{" "}
                            {formatCurrency(
                              customer.totalSpent / customer.orderCount,
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
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
                          </p>
                          <p className="text-xs text-gray-600">
                            {STATUS_LABELS[customer.lastStatus] ??
                              customer.lastStatus}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet: tabela */}
                <div className="hidden overflow-x-auto md:block">
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
              </>
            )}
          </div>
        </div>
    </AdminPageLayout>
  );
}
