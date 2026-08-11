/**
 * Status do pedido (cozinha) e status da entrega (logística) são fluxos
 * separados no backend. Aqui o status do pedido é sempre a fonte da verdade;
 * a entrega só refina o rótulo quando o pedido já saiu para o cliente.
 */

export const ORDER_STEPS = [
  "Confirmado",
  "Em preparo",
  "Pronto",
  "Concluído",
] as const;

/** Carrinho aberto e pedido abandonado não são compras - não entram na lista. */
const HIDDEN_STATUSES = ["CART", "ABANDONED"];

const FINISHED_STATUSES = ["COMPLETED", "CANCELED"];

const STEP_BY_STATUS: Record<string, number> = {
  AWAITING_PAYMENT: 0,
  ORDERED: 0,
  IN_PRODUCTION: 1,
  READY_FOR_PICKUP: 2,
  COMPLETED: 3,
  CANCELED: 3,
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  CART: "Carrinho",
  AWAITING_PAYMENT: "Aguardando pagamento",
  ORDERED: "Pedido confirmado",
  IN_PRODUCTION: "Em preparo",
  READY_FOR_PICKUP: "Pronto",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  ABANDONED: "Abandonado",
};

/** Entrega já retirada pelo entregador - o pedido está a caminho do cliente. */
const DELIVERY_IN_TRANSIT = ["PICKED_UP"];
const DELIVERY_DELIVERED = ["DELIVERED", "RECEIVED", "COMPLETED"];

/** Aceita tanto o `Order` da API quanto objetos parciais das telas. */
type OrderLike = {
  status?: string | null;
  delivery?: { status?: string | null } | null;
};

export function getOrderStatus(order: OrderLike) {
  return String(order?.status ?? "").toUpperCase();
}

function getDeliveryStatus(order: OrderLike) {
  return String(order?.delivery?.status ?? "").toUpperCase();
}

export function isListableOrder(order: OrderLike) {
  return !HIDDEN_STATUSES.includes(getOrderStatus(order));
}

export function isCanceledOrder(order: OrderLike) {
  return getOrderStatus(order) === "CANCELED";
}

export function isActiveOrder(order: OrderLike) {
  return !FINISHED_STATUSES.includes(getOrderStatus(order));
}

export function getOrderStep(order: OrderLike) {
  const step = STEP_BY_STATUS[getOrderStatus(order)];

  if (step === undefined) return 0;

  // Entrega concluída antecipa o último passo mesmo antes de o restaurante
  // fechar o pedido como COMPLETED.
  if (step === 2 && DELIVERY_DELIVERED.includes(getDeliveryStatus(order))) {
    return 3;
  }

  return step;
}

export function getOrderStatusLabel(order: OrderLike) {
  const status = getOrderStatus(order);

  if (status === "READY_FOR_PICKUP") {
    const deliveryStatus = getDeliveryStatus(order);

    if (DELIVERY_IN_TRANSIT.includes(deliveryStatus)) return "A caminho";
    if (DELIVERY_DELIVERED.includes(deliveryStatus)) return "Entregue";
  }

  return ORDER_STATUS_LABELS[status] ?? "Em andamento";
}

export function getOrderStatusBadgeClass(order: OrderLike) {
  if (isCanceledOrder(order)) return "bg-red-50 text-red-600";
  if (!isActiveOrder(order)) return "bg-green-50 text-green-600";

  return "bg-orange-50 text-orange-600";
}
