"use client";

import { BackButton } from "@/components/back-button";

import { MainHeader } from "@/components/main-header";
import ProtectedRoute from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { BottomBar } from "@/components/ui/bottom-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground, GradientButton } from "@/components/ui/custom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartActions, useOrderHistory } from "@/hooks";
import { formatCurrency } from "@/utils/format-currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  MapPin,
  Package,
  RefreshCw,
  Store,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import router from "next/router";

const statusConfig = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  PREPARING: { label: "Em preparação", color: "bg-orange-100 text-orange-800" },
  READY: { label: "Pronto", color: "bg-purple-100 text-purple-800" },
  IN_TRANSIT: {
    label: "Saiu para entrega",
    color: "bg-indigo-100 text-indigo-800",
  },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default function OrderHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <OrderHistoryContent />
    </ProtectedRoute>
  );
}

function OrderHistoryContent() {
  const { orders, loading, error, refreshHistory } = useOrderHistory();

  const activeOrders = orders.filter((order) =>
    ["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_TRANSIT"].includes(
      order.status,
    ),
  );

  const completedOrders = orders.filter((order) =>
    ["DELIVERED", "CANCELLED"].includes(order.status),
  );
  const { totalItems } = useCartActions();
  if (loading) {
    return (
      <>
        <AnimatedBackground showBlobs={true} blobCount={2}>
          <div className="min-h-screen pt-20 sm:pt-24 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Skeleton Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    {[1, 2].map((j) => (
                      <Skeleton
                        key={j}
                        className="h-24 w-full mb-3 rounded-xl"
                      />
                    ))}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </AnimatedBackground>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AnimatedBackground showBlobs={true} blobCount={2}>
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-red-600">
                  Erro ao carregar pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refreshHistory} className="w-full">
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </AnimatedBackground>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground showBlobs={true} blobCount={3}>
        <div className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-8 min-h-screen">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="bg-linear-to-r from-orange-500 to-orange-600 bg-clip-text text-3xl font-bold text-transparent">
                  Meus Pedidos
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Acompanhe seus pedidos em tempo real
                </p>
              </div>
            </div>

            <Button
              onClick={refreshHistory}
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="bg-linear-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {activeOrders.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Em andamento</p>
                </div>
                <Clock className="w-10 h-10 text-orange-400" />
              </div>
            </div>

            <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {completedOrders.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Entregues</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {orders.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total</p>
                </div>
                <Package className="w-10 h-10 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Pedidos em Andamento
              </h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Pedidos Anteriores
              </h2>
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-20 h-20 text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Nenhum pedido ainda
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Quando você fizer seu primeiro pedido, ele aparecerá aqui
              </p>
              <Link href="/restaurants">
                <GradientButton>Explorar Restaurantes</GradientButton>
              </Link>
            </div>
          )}
        </div>
        <BottomBar activeTab="orders" />
      </AnimatedBackground>
    </>
  );
}

/* ====================== ORDER CARD ====================== */
function OrderCard({ order }: { order: any }) {
  const isActive = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "IN_TRANSIT",
  ].includes(order.status);

  return (
    <Link href={`/order-status?orderId=${order.orderId}`} className="block">
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            {/* Restaurant Info */}
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <Store className="h-6 w-6 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {(order as any).order?.company?.name || "Restaurante"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pedido #{order.orderId.slice(0, 8)}
                  </p>
                </div>
              </div>

              {order.deliveryAddress && (
                <div className="flex items-start gap-3 mt-4">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress.street},{" "}
                    {order.deliveryAddress.number} -{" "}
                    {order.deliveryAddress.neighborhood}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(order.created_at),
                    "dd 'de' MMMM 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </p>
              </div>
            </div>

            {/* Status + Value */}
            <div className="flex flex-col items-end gap-3 min-w-[140px]">
              <Badge
                className={
                  statusConfig[order.status as keyof typeof statusConfig]
                    ?.color || "bg-gray-100 text-gray-800"
                }
              >
                {statusConfig[order.status as keyof typeof statusConfig]
                  ?.label || order.status}
              </Badge>

              {(order as any).order?.totalValue && (
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((order as any).order.totalValue)}
                </p>
              )}

              {isActive && (
                <div className="text-xs text-orange-600 font-medium flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  Em andamento
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
