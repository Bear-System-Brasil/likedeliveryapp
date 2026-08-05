import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CompanyOrder, CANCEL_REASONS } from '@/constants/order-management'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface CancelOrderDialogProps {
  order: CompanyOrder | null
  open: boolean
  onClose: () => void
  onConfirm: (orderId: string, reason: string) => void
  isLoading?: boolean
}

export function CancelOrderDialog({
  order,
  open,
  onClose,
  onConfirm,
  isLoading,
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const handleConfirm = () => {
    if (!order) return
    const reason = selectedReason === 'Outro' ? customReason : selectedReason
    if (!reason.trim()) return
    onConfirm(order.id, reason)
  }

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    onClose()
  }

  const orderNumber = order?.orderNumber || order?.id?.slice(0, 6) || '---'
  const isValid = selectedReason && (selectedReason !== 'Outro' || customReason.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Pedido #{orderNumber}
          </DialogTitle>
          <DialogDescription>
            Selecione o motivo do cancelamento. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Motivo do cancelamento</Label>
          <div className="grid gap-2">
            {CANCEL_REASONS.map((reason) => (
              <Button
                key={reason}
                type="button"
                variant={selectedReason === reason ? 'default' : 'outline'}
                size="sm"
                className="justify-start cursor-pointer text-left h-auto py-2"
                onClick={() => setSelectedReason(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>

          {selectedReason === 'Outro' && (
            <div className="space-y-1.5">
              <Label className="text-sm">Descreva o motivo</Label>
              <Textarea
                placeholder="Informe o motivo do cancelamento..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-20"
                maxLength={500}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="cursor-pointer">
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="cursor-pointer"
          >
            {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
