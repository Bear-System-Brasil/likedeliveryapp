import type { CustomerRef, Order, OrderItem, Payment } from '@/services/api'

// ─────────────────────────────────────────────────────────────────────────────
// Types — Order com relações do Prisma retornadas por GET /order/company
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyOrderItem extends OrderItem {
  product?: {
    id: string
    name: string
    salePrice: number
  }
  addOns?: Array<{
    id: string
    quantity: number
    priceSnapshot: number
    productAddOns?: { description: string }
  }>
  variations?: Array<{
    id: string
    priceSnapshot: number
    productVariation?: { description: string }
  }>
}

export interface CompanyOrder extends Omit<Order, 'orderedItems'> {
  orderNumber?: number
  cancelReason?: string
  customer?: CustomerRef
  orderedItems?: CompanyOrderItem[]
  payments?: Payment[]
  delivery?: {
    id: string
    status: string
    deliveryAddress?: Record<string, unknown>
    deliveryPerson?: {
      id: string
      name: string
      phone?: string
    }
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Colunas do Kanban — baseadas em status de Order
// ─────────────────────────────────────────────────────────────────────────────

export type ColumnId = 'new' | 'preparing' | 'ready' | 'completed'

export interface ColumnConfig {
  id: ColumnId
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  badgeColor: string
  headerBg: string
  orderStatuses: string[]
}

export const COLUMNS: ColumnConfig[] = [
  {
    id: 'new',
    label: 'Novos',
    description: 'Aguardando início do preparo',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-500',
    headerBg: 'bg-amber-100',
    orderStatuses: ['ORDERED'],
  },
  {
    id: 'preparing',
    label: 'Em Preparo',
    description: 'Pedidos sendo preparados',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-500',
    headerBg: 'bg-blue-100',
    orderStatuses: ['IN_PRODUCTION'],
  },
  {
    id: 'ready',
    label: 'Prontos',
    description: 'Prontos para retirada ou entrega',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-100',
    orderStatuses: ['READY_FOR_PICKUP'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Ações por coluna
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnAction {
  label: string
  nextStatus: string
}

export const COLUMN_ACTIONS: Record<ColumnId, ColumnAction | null> = {
  new: { label: 'Iniciar Preparo', nextStatus: 'IN_PRODUCTION' },
  preparing: { label: 'Marcar como Pronto', nextStatus: 'READY_FOR_PICKUP' },
  ready: { label: 'Marcar como Entregue', nextStatus: 'COMPLETED' },
  completed: null,
}

// ─────────────────────────────────────────────────────────────────────────────
// Motivos de cancelamento
// ─────────────────────────────────────────────────────────────────────────────

export const CANCEL_REASONS = [
  'Falta de estoque / Item indisponível',
  'Restaurante fechando / Fechamento antecipado',
  'Fora do raio de entrega',
  'Pedido duplicado',
  'Cliente solicitou cancelamento',
  'Tempo de espera muito longo',
  'Erro no pedido',
  'Outro',
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Intervalo de polling
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_POLL_INTERVAL = 15_000

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getColumnForOrder(order: CompanyOrder): ColumnId | 'canceled' {
  if (order.status === 'CANCELED') return 'canceled'
  if (order.status === 'COMPLETED') return 'completed'
  if (['CART', 'AWAITING_PAYMENT', 'ABANDONED'].includes(order.status)) return 'completed'

  for (const col of COLUMNS) {
    if (col.orderStatuses.includes(order.status)) {
      return col.id
    }
  }

  return 'completed'
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getElapsedTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (minutes < 1) return 'Agora'
  if (hours > 0) return `${hours}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ''}`
  return `${minutes}min`
}

export function getOrderItemDisplayName(item: CompanyOrderItem): string {
  if (item.product?.name) return item.product.name
  return `Produto #${item.productId.slice(0, 6)}`
}

export function getPaymentMethodLabel(method?: string): string {
  const labels: Record<string, string> = {
    CASH: 'Dinheiro',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    PIX: 'PIX',
    BANK_TRANSFER: 'Transferência',
  }
  return method ? labels[method] || method : 'Não informado'
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ORDERED: 'Novo',
    IN_PRODUCTION: 'Em Preparo',
    READY_FOR_PICKUP: 'Pronto',
    COMPLETED: 'Concluído',
    CANCELED: 'Cancelado',
    CART: 'Carrinho',
    AWAITING_PAYMENT: 'Aguardando Pagamento',
    ABANDONED: 'Abandonado',
  }
  return labels[status] || status
}
