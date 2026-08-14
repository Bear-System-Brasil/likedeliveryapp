import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  type CompanyOrder,
  formatCurrency,
  getColumnForOrder,
  COLUMN_ACTIONS,
} from '@/constants/order-management'
import { CheckCircle, ChefHat } from 'lucide-react'

interface ActionOrderDialogProps {
  order: CompanyOrder | null
  open: boolean
  onClose: () => void
  onConfirm: (orderId: string, nextStatus: string) => void
  isLoading?: boolean
}

export function AcceptOrderDialog({
  order,
  open,
  onClose,
  onConfirm,
  isLoading,
}: ActionOrderDialogProps) {
  if (!order) return null

  // Antes assumia 'preparing' para tudo que nao fosse ORDERED, o que mandava
  // READY_FOR_PICKUP de volta para um pedido que ja estava pronto.
  const columnId = getColumnForOrder(order)
  const action = columnId === 'canceled' ? null : COLUMN_ACTIONS[columnId]

  const handleConfirm = () => {
    if (!action) return
    onConfirm(order.id, action.nextStatus)
  }

  const orderNumber = order.orderNumber || order.id.slice(0, 6)
  const customerName = order.customer?.name || 'Cliente'
  const items = order.orderedItems || []
  const totalValue = order.totalValue || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {columnId === 'ready' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <ChefHat className="h-5 w-5 text-blue-600" />
            )}
            {action?.label || 'Confirmar ação'} — Pedido #{orderNumber}
          </DialogTitle>
          <DialogDescription>
            {customerName} — {items.length} {items.length === 1 ? 'item' : 'itens'} — {formatCurrency(totalValue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.product?.name || `Produto #${item.productId.slice(0, 6)}`}</span>
              <span className="text-muted-foreground">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Voltar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="cursor-pointer">
            {isLoading ? 'Atualizando...' : `Confirmar — ${action?.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
