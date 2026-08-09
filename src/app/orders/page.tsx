"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Package,
  PackageCheck,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { MainHeader } from "@/components/main-header";
import ProtectedRoute from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { useCartActions, useOrderHistory } from "@/hooks";
import { useAuthStore } from "@/stores/auth-store";
import { apiService } from "@/services/api";
import { formatCurrency } from "@/utils/format-currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STEPS = ["Confirmado", "Preparando", "A caminho", "Entregue"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pedido confirmado",
  CONFIRMED: "Pedido confirmado",
  ACCEPTED: "Pedido confirmado",
  PREPARING: "Em preparo",
  IN_PRODUCTION: "Em preparo",
  READY: "A caminho",
  READY_FOR_PICKUP: "A caminho",
  PICKED_UP: "A caminho",
  IN_TRANSIT: "A caminho",
  OUT_FOR_DELIVERY: "A caminho",
  DELIVERED: "Entregue",
  COMPLETED: "Entregue",
  CANCELLED: "Cancelado",
  CANCELED: "Cancelado",
};

function getOrderStatus(order: any) {
  return String(order.status || order.order?.status || "PENDING").toUpperCase();
}

function getStatusStep(status: string) {
  if (["PREPARING", "IN_PRODUCTION"].includes(status)) return 1;
  if (
    [
      "READY",
      "READY_FOR_PICKUP",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
    ].includes(status)
  ) {
    return 2;
  }
  if (["DELIVERED", "COMPLETED"].includes(status)) return 3;
  return 0;
}

function isActiveStatus(status: string) {
  return !["DELIVERED", "COMPLETED", "CANCELLED", "CANCELED"].includes(
    status,
  );
}

function getStatusBadgeLabel(status: string) {
  return (
    STATUS_LABELS[status] ||
    (isActiveStatus(status) ? "Em andamento" : "Finalizado")
  );
}

function getStatusBadgeClass(status: string) {
  if (["CANCELLED", "CANCELED"].includes(status)) {
    return "bg-red-50 text-red-600";
  }

  if (["DELIVERED", "COMPLETED"].includes(status)) {
    return "bg-green-50 text-green-600";
  }

  return "bg-orange-50 text-orange-600";
}

function getRestaurantName(order: any) {
  return (
    order.order?.company?.tradeName ||
    order.order?.company?.name ||
    order.company?.tradeName ||
    order.company?.name ||
    "Restaurante"
  );
}

function getOrderId(order: any) {
  return order.orderId || order.order?.id || order.id;
}

function getOrderTotal(order: any) {
  return Number(order.order?.totalValue ?? order.totalValue ?? 0);
}

function getItemCount(order: any) {
  const items = order.order?.orderedItems || order.orderedItems || [];
  const quantity = items.reduce(
    (total: number, item: any) => total + Number(item.quantity || 0),
    0,
  );

  return quantity > 0 ? quantity : null;
}

function getOrderDate(order: any) {
  const value = order.created_at || order.order?.created_at;
  if (!value) return "Data não disponível";

  try {
    return format(new Date(value), "dd 'de' MMM · HH:mm", { locale: ptBR });
  } catch {
    return "Data não disponível";
  }
}

function getOrderTimestamp(order: any) {
  const value = order.created_at || order.order?.created_at;
  return value ? new Date(value).getTime() || 0 : 0;
}

export default function OrderHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <OrderHistoryContent />
    </ProtectedRoute>
  );
}

function OrderHistoryContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, allOrders, loading, error, refreshHistory } = useOrderHistory();
  const { totalItems, handleAddToCart } = useCartActions();
  const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);

  const sourceOrders = useMemo(() => {
    const orderList = allOrders?.length ? allOrders : orders;
    return [...orderList].sort(
      (first, second) => getOrderTimestamp(second) - getOrderTimestamp(first),
    );
  }, [allOrders, orders]);

  const handleRepeatOrder = async (order: any) => {
    const orderId = getOrderId(order);
    if (!orderId || !user?.id) {
      toast.error("Não foi possível carregar esse pedido");
      return;
    }

    setRepeatingOrderId(orderId);

    try {
      const itemsResponse = await apiService.orderItems.listByOrder(
        orderId,
        user.id,
      );
      const orderItems = (itemsResponse.data as any[]) || [];
      const companyId =
        order.order?.companyId || order.companyId || order.order?.company?.id;
      const restaurantName = getRestaurantName(order);

      if (!companyId || orderItems.length === 0) {
        throw new Error("Itens indisponíveis para repetir");
      }

      let addedItems = 0;

      for (const item of orderItems) {
        const embeddedProduct = item.product;
        const productResponse = embeddedProduct
          ? { success: true, data: embeddedProduct }
          : await apiService.getProduct(item.productId);
        const product = productResponse.success ? productResponse.data : null;

        if (!product) continue;

        const added = await handleAddToCart({
          id: item.productId,
          name: product.name,
          price: Number(item.unitPrice || product.salePrice || 0),
          quantity: Number(item.quantity || 1),
          restaurantId: companyId,
          restaurantName,
          image: product.imageURL?.[0]?.url,
        });

        if (added) addedItems += 1;
      }

      if (addedItems === 0) {
        throw new Error("Nenhum item disponível para repetir");
      }

      toast.success("Itens adicionados ao carrinho");
      router.push("/cart");
    } catch (repeatError: any) {
      toast.error(repeatError.message || "Não foi possível repetir o pedido");
    } finally {
      setRepeatingOrderId(null);
    }
  };

  if (loading) return <OrdersPageSkeleton />;

  if (error) {
    return (
      <OrdersShell cartItems={totalItems}>
        <div className="mx-auto flex min-h-[65vh] max-w-md items-center justify-center px-4">
          <Card className="w-full border-[#e9eaee] bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Package className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-lg font-extrabold text-[#14161a]">
              Não foi possível carregar seus pedidos
            </h1>
            <p className="mt-2 text-sm text-[#8a8f99]">{error}</p>
            <Button
              type="button"
              onClick={refreshHistory}
              className="mt-5 h-10 rounded-lg bg-orange-500 px-5 font-bold hover:bg-orange-600"
            >
              Tentar novamente
            </Button>
          </Card>
        </div>
      </OrdersShell>
    );
  }

  return (
    <OrdersShell cartItems={totalItems}>
      <main className="px-3 pb-20 pt-24 sm:px-5 sm:pt-28 md:pb-10">
        <div className="mx-auto max-w-[1160px]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e9eaee] bg-white text-[#3d4149] transition hover:border-gray-300"
                aria-label="Voltar"
                title="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[20px] font-extrabold tracking-[-0.02em] text-[#14161a] sm:text-[22px]">
                  Meus pedidos
                </h1>
                <p className="mt-0.5 text-xs font-medium text-[#8a8f99] sm:text-sm">
                  Acompanhe suas compras e repita seus favoritos.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={refreshHistory}
              className="h-8 w-8 shrink-0 rounded-lg border-[#e9eaee] bg-white"
              aria-label="Atualizar pedidos"
              title="Atualizar pedidos"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {sourceOrders.length === 0 ? (
            <EmptyOrdersState onExplore={() => router.push("/")} />
          ) : (
            <div className="space-y-3">
              {sourceOrders.map((order) => {
                const status = getOrderStatus(order);
                const active = isActiveStatus(status);

                return active ? (
                  <ActiveOrderCard
                    key={getOrderId(order)}
                    order={order}
                    onTrack={() => router.push(`/order-status?orderId=${getOrderId(order)}`)}
                  />
                ) : (
                  <CompletedOrderCard
                    key={getOrderId(order)}
                    order={order}
                    isRepeating={repeatingOrderId === getOrderId(order)}
                    onView={() => router.push(`/order-status?orderId=${getOrderId(order)}`)}
                    onRepeat={() => handleRepeatOrder(order)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </OrdersShell>
  );
}

function OrdersShell({
  children,
  cartItems,
}: {
  children: React.ReactNode;
  cartItems: number;
}) {
  const router = useRouter();

  return (
    <AnimatedBackground showBlobs={false} className="min-h-screen bg-[#f4f5f7] py-0">
      <MainHeader
        cartItems={cartItems}
        onCartClick={() => router.push("/cart")}
        showSearch={false}
        showNav={true}
      />
      {children}
    </AnimatedBackground>
  );
}

function ActiveOrderCard({
  order,
  onTrack,
}: {
  order: any;
  onTrack: () => void;
}) {
  const status = getOrderStatus(order);
  const step = getStatusStep(status);
  const itemCount = getItemCount(order);
  const eta = order.estimatedTime || order.order?.estimatedTime || "Acompanhe a entrega";

  return (
    <Card className="border-[#e9eaee] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-orange-50 text-orange-500">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-[#14161a] sm:text-[15px]">
              {getRestaurantName(order)}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#8a8f99]">
              Pedido #{String(getOrderId(order)).slice(0, 8)}
              {itemCount ? ` · ${itemCount} ${itemCount === 1 ? "item" : "itens"}` : ""}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold sm:shrink-0 sm:text-xs ${getStatusBadgeClass(status)}`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {getStatusBadgeLabel(status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-1">
        {STEPS.map((label, index) => {
          const done = index <= step;
          const current = index === step;

          return (
            <div key={label} className="relative text-center">
              {index < STEPS.length - 1 && (
                <span
                  className={`absolute left-1/2 top-2.5 h-px w-full ${
                    index < step ? "bg-orange-500" : "bg-[#e9eaee]"
                  }`}
                />
              )}
              <span
                className={`relative z-10 mx-auto flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white ${
                  done
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-[#d6d8dd] text-transparent"
                } ${current ? "ring-4 ring-orange-50" : ""}`}
              >
                {done && <Check className="h-3 w-3" />}
              </span>
              <span
                className={`mt-2 block whitespace-nowrap text-[9px] font-semibold sm:text-[10px] ${
                  done ? "text-[#3d4149]" : "text-[#a2a6ae]"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[#e9eaee] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8a8f99]">
          <Clock3 className="h-3.5 w-3.5" />
          {eta}
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm font-extrabold text-[#14161a]">
            {formatCurrency(getOrderTotal(order))}
          </span>
          <Button
            type="button"
            onClick={onTrack}
            className="h-9 rounded-lg bg-orange-500 px-3 text-xs font-bold hover:bg-orange-600"
          >
            Acompanhar pedido
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CompletedOrderCard({
  order,
  isRepeating,
  onView,
  onRepeat,
}: {
  order: any;
  isRepeating: boolean;
  onView: () => void;
  onRepeat: () => void;
}) {
  const status = getOrderStatus(order);
  const isCancelled = ["CANCELLED", "CANCELED"].includes(status);
  const itemCount = getItemCount(order);

  return (
    <Card className="border-[#e9eaee] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              isCancelled
                ? "bg-red-50 text-red-500"
                : "bg-green-50 text-green-600"
            }`}
          >
            {isCancelled ? (
              <Package className="h-5 w-5" />
            ) : (
              <PackageCheck className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-[#14161a] sm:text-[15px]">
              {getRestaurantName(order)}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#8a8f99]">
              Pedido #{String(getOrderId(order)).slice(0, 8)} · {getOrderDate(order)}
            </p>
            <p className="mt-1 text-xs font-medium text-[#8a8f99]">
              {itemCount
                ? `${itemCount} ${itemCount === 1 ? "item" : "itens"}`
                : "Itens do pedido"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-end">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold ${getStatusBadgeClass(status)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {getStatusBadgeLabel(status)}
          </span>
          <span className="text-base font-extrabold text-[#14161a]">
            {formatCurrency(getOrderTotal(order))}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[#e9eaee] pt-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onView}
          className="h-9 rounded-lg border-[#e9eaee] text-xs font-bold text-[#3d4149]"
        >
          Ver pedido
        </Button>
        {!isCancelled && (
          <Button
            type="button"
            onClick={onRepeat}
            disabled={isRepeating}
            className="h-9 rounded-lg bg-orange-500 text-xs font-bold hover:bg-orange-600"
          >
            {isRepeating ? (
              <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Pedir novamente
          </Button>
        )}
      </div>
    </Card>
  );
}

function EmptyOrdersState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <Card className="w-full max-w-md border-[#e9eaee] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-[#14161a]">
          Você ainda não fez pedidos
        </h2>
        <p className="mt-2 text-sm text-[#8a8f99]">
          Explore os restaurantes e encontre algo gostoso para pedir.
        </p>
        <Button
          type="button"
          onClick={onExplore}
          className="mt-5 h-10 rounded-lg bg-orange-500 px-5 font-bold hover:bg-orange-600"
        >
          Explorar restaurantes
        </Button>
      </Card>
    </div>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] pt-24">
      <div className="mx-auto max-w-[1160px] space-y-4 px-3 sm:px-5">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
        {["a", "b"].map((item) => (
          <div key={item} className="h-52 animate-pulse rounded-lg bg-white" />
        ))}
      </div>
    </div>
  );
}
