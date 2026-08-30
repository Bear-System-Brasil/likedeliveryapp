import {
  DELIVERY_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type KitchenDeliveryStatus,
  type KitchenOrder,
  type KitchenOrderItem,
} from "./types";

/** Faixas de envelhecimento do card — a cor é lida antes do número. */
export type ElapsedTier = "fresh" | "warm" | "late" | "critical";

export interface ElapsedInfo {
  minutes: number;
  label: string;
  tier: ElapsedTier;
  className: string;
}

const TIER_CLASSES: Record<ElapsedTier, string> = {
  fresh: "bg-slate-100 text-slate-600",
  warm: "bg-amber-100 text-amber-800",
  late: "bg-orange-200 text-orange-900",
  critical: "bg-red-600 text-white",
};

export function getElapsed(dateString: string): ElapsedInfo {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(dateString).getTime()) / 60_000),
  );

  const tier: ElapsedTier =
    minutes >= 30 ? "critical" : minutes >= 15 ? "late" : minutes >= 5 ? "warm" : "fresh";

  const hours = Math.floor(minutes / 60);
  const label =
    minutes < 1
      ? "agora"
      : hours > 0
        ? `${hours}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ""}`
        : `${minutes} min`;

  return { minutes, label, tier, className: TIER_CLASSES[tier] };
}

export function getItemName(item: KitchenOrderItem): string {
  return item.product?.name || `Produto ${item.productId.slice(0, 6)}`;
}

export function getOrderLabel(order: KitchenOrder): string {
  return String(order.orderNumber ?? order.id.slice(0, 6));
}

export function getCustomerName(order: KitchenOrder): string {
  return order.customer?.name?.trim() || "Cliente não identificado";
}

export function getPaymentLabel(order: KitchenOrder): string | null {
  const method = order.payments?.[0]?.paymentMethod;
  if (!method) return null;
  return PAYMENT_METHOD_LABELS[String(method)] ?? String(method);
}

export function getDeliveryLabel(order: KitchenOrder): string | null {
  const status = order.delivery?.status;
  if (!status) return null;
  return DELIVERY_STATUS_LABELS[status as KitchenDeliveryStatus] ?? null;
}

/** Selo de entrega: informativo, sem semântica de erro. */
export function getDeliveryToneClass(order: KitchenOrder): string {
  switch (order.delivery?.status) {
    case "PICKED_UP":
      return "bg-emerald-100 text-emerald-800";
    case "ACCEPTED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
