"use client"

import { AdminPageLayout } from "@/components/admin-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiService } from "@/services/api"
import { Order } from "@/services/api"
import { formatCurrency } from "@/utils"
import { useAuthStore } from "@/stores"
import { useQuery } from "@tanstack/react-query"
import { ClipboardList, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"

const STATUS_LABELS: Record<string, string> = {
  CART: "Carrinho",
  ORDERED: "Recebido",
  AWAITING_PAYMENT: "Aguard. Pagamento",
  IN_PRODUCTION: "Em Produção",
  READY_FOR_PICKUP: "Pronto p/ Retirada",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  ABANDONED: "Abandonado",
}

const STATUS_COLORS: Record<string, string> = {
  CART: "bg-gray-100 text-gray-700",
  ORDERED: "bg-blue-100 text-blue-700",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
  IN_PRODUCTION: "bg-orange-100 text-orange-700",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELED: "bg-red-100 text-red-700",
  ABANDONED: "bg-gray-100 text-gray-500",
}

type FilterStatus = "ALL" | Order["status"]

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "ORDERED", label: "Recebido" },
  { value: "AWAITING_PAYMENT", label: "Aguard. Pagamento" },
  { value: "IN_PRODUCTION", label: "Em Produção" },
  { value: "READY_FOR_PICKUP", label: "Pronto p/ Retirada" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELED", label: "Cancelado" },
]

export default function OrdersPage() {
  const { token } = useAuthStore()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["financial", "orders"],
    queryFn: async () => {
      const response = await apiService.orders.getCompanyOrders()
      if (!response.success || !response.data) return []
      return response.data
    },
    enabled: !!token,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const filtered = useMemo(() => {
    if (filterStatus === "ALL") return orders
    return orders.filter((o) => o.status === filterStatus)
  }, [orders, filterStatus])

  const counts = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) =>
      ["ORDERED", "AWAITING_PAYMENT", "IN_PRODUCTION", "READY_FOR_PICKUP"].includes(o.status)
    ).length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    canceled: orders.filter((o) => o.status === "CANCELED").length,
  }), [orders])

  return (
    <AdminPageLayout
      title="Pedidos da Empresa"
      icon={ClipboardList}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-64 lg:pr-8"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-xl gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: counts.total, color: "text-gray-700" },
              { label: "Em andamento", value: counts.pending, color: "text-orange-600" },
              { label: "Concluídos", value: counts.completed, color: "text-green-600" },
              { label: "Cancelados", value: counts.canceled, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as FilterStatus)}
            >
              <SelectTrigger className="w-full rounded-xl sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">
              {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
            </span>
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
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum pedido encontrado</p>
                <p className="text-sm mt-1">Ajuste o filtro para ver outros pedidos</p>
              </div>
            ) : (
              <>
                {/* Mobile: lista em cards */}
                <div className="divide-y divide-gray-100 md:hidden">
                  {filtered.map((order) => (
                    <div key={order.id} className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-gray-500">
                            {order.id.slice(0, 8)}…
                          </p>
                          <p className="mt-1 font-mono text-xs text-gray-500">
                            Cliente {order.customerId.slice(0, 8)}…
                          </p>
                        </div>
                        <Badge
                          className={`shrink-0 text-xs ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(order.totalValue)}
                        </span>
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
                          ID
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Data
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Cliente
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Total
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">
                            {order.id.slice(0, 8)}…
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(order.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">
                            {order.customerId.slice(0, 8)}…
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(order.totalValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              className={`text-xs ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                            >
                              {STATUS_LABELS[order.status] ?? order.status}
                            </Badge>
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
  )
}
