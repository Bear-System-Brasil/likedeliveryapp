"use client";

/**
 * Modal de detalhe de pedido — compartilhado entre /order-management e
 * /kitchen (e qualquer outra tela que precise do mesmo resumo). Não conhece
 * `ColumnId`/`COLUMN_ACTIONS` nem `KitchenStatus`/`KITCHEN_COLUMNS`: quem
 * chama já resolve o rótulo do botão principal para a própria tela.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  formatCurrency,
  getAddOnLabel,
  getElapsedTime,
  getOrderItemDisplayName,
  getPaymentMethodLabel,
  getVariationLabel,
} from "@/constants/order-management";
import {
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Printer,
  Truck,
  User,
  X,
} from "lucide-react";

/** O mínimo que o modal precisa ler — CompanyOrder e KitchenOrder satisfazem isso estruturalmente. */
export interface DetailableOrder {
  id: string;
  orderNumber?: number | string;
  status: string;
  created_at: string;
  observations?: string | null;
  totalValue?: number;
  discount?: number;
  totalShipping?: number;
  cancelReason?: string | null;
  customer?: { name?: string; phone?: string } | null;
  orderedItems?: Array<{
    id: string;
    quantity: number;
    unitPrice?: number;
    productId: string;
    product?: { name: string } | null;
    addOns?: Array<{
      productAddOn?: { name?: string; description?: string } | null;
      productAddOns?: { name?: string; description?: string } | null;
      addOn?: { name?: string; description?: string } | null;
      name?: string | null;
      description?: string | null;
    }> | null;
    variations?: Array<{
      variation?: { name?: string; description?: string } | null;
      productVariation?: { name?: string; description?: string } | null;
      name?: string | null;
      description?: string | null;
    }> | null;
  }> | null;
  payments?: Array<{ paymentMethod: string }> | null;
  delivery?: {
    deliveryPerson?: { name: string; phone?: string } | null;
  } | null;
}

interface OrderDetailSheetProps<TOrder extends DetailableOrder> {
  order: TOrder | null;
  open: boolean;
  onClose: () => void;
  /** Rótulo do botão principal; `null`/ausente esconde o botão. */
  actionLabel?: string | null;
  onAction?: (order: TOrder) => void;
  onCancel?: (order: TOrder) => void;
  onPrint?: (order: TOrder) => void;
  isUpdating?: boolean;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ORDERED: { label: "Novo", variant: "default" },
  IN_PRODUCTION: { label: "Em Preparo", variant: "secondary" },
  READY_FOR_PICKUP: { label: "Pronto", variant: "secondary" },
  COMPLETED: { label: "Concluído", variant: "outline" },
  CANCELED: { label: "Cancelado", variant: "destructive" },
};

export function OrderDetailSheet<TOrder extends DetailableOrder>({
  order,
  open,
  onClose,
  actionLabel,
  onAction,
  onCancel,
  onPrint,
  isUpdating,
}: OrderDetailSheetProps<TOrder>) {
  if (!order) return null;

  const items = order.orderedItems || [];
  const orderNumber = order.orderNumber || order.id.slice(0, 6);
  const customerName = order.customer?.name || "Cliente";
  const customerPhone = order.customer?.phone;
  const payment = order.payments?.[0];
  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, variant: "outline" as const };
  const isCanceled = order.status === "CANCELED";
  const isCompleted = order.status === "COMPLETED";
  const isDone = isCanceled || isCompleted;

  // `deliveryAddress` não faz parte do contrato mínimo (só a cozinha ainda
  // não expõe endereço) — lido de forma defensiva, igual ao `as any` original.
  const deliveryAddress = (
    order.delivery as { deliveryAddress?: Record<string, unknown> } | null | undefined
  )?.deliveryAddress;
  const deliveryPerson = order.delivery?.deliveryPerson;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Pedido #{orderNumber}</SheetTitle>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Recebido há {getElapsedTime(order.created_at)}</span>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Cliente */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Cliente
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{customerName}</p>
              {customerPhone && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {customerPhone}
                </p>
              )}
            </div>
          </section>

          <Separator />

          {/* Itens */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Itens do Pedido ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {item.quantity}x {getOrderItemDisplayName(item)}
                    </p>
                    {item.addOns?.map((addon, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-4">
                        + {getAddOnLabel(addon)}
                      </p>
                    ))}
                    {item.variations?.map((v, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-4">
                        {getVariationLabel(v)}
                      </p>
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency((item.unitPrice ?? 0) * item.quantity)}
                  </span>
                </div>
              ))}

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
              )}
            </div>
          </section>

          {/* Cancelamento */}
          {isCanceled && order.cancelReason && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold mb-2 text-red-600">Motivo do Cancelamento</h3>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {order.cancelReason}
                </div>
              </section>
            </>
          )}

          {/* Endereço de entrega (se disponível via delivery) */}
          {deliveryAddress && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </h3>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>
                    {String(deliveryAddress.street ?? "")}, {String(deliveryAddress.number ?? "")}
                    {deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""}
                  </p>
                  <p>
                    {String(deliveryAddress.neighborhood ?? "")} — {String(deliveryAddress.city ?? "")}/
                    {String(deliveryAddress.state ?? "")}
                  </p>
                  <p>CEP: {String(deliveryAddress.zipCode ?? "")}</p>
                  {deliveryAddress.reference ? (
                    <p className="text-xs">Ref: {String(deliveryAddress.reference)}</p>
                  ) : null}
                </div>
              </section>
            </>
          )}

          {/* Entregador (se atribuído) */}
          {deliveryPerson && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Truck className="h-4 w-4" />
                  Entregador
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{deliveryPerson.name}</p>
                    {deliveryPerson.phone && (
                      <p className="text-xs text-muted-foreground">{deliveryPerson.phone}</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Resumo financeiro */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatCurrency(
                    (order.totalValue || 0) - (order.totalShipping || 0) + (order.discount || 0),
                  )}
                </span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(order.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrega</span>
                <span>{formatCurrency(order.totalShipping || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalValue || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Forma de pagamento</span>
                <span>{getPaymentMethodLabel(payment?.paymentMethod)}</span>
              </div>
            </div>
          </section>

          {/* Ações */}
          {!isDone && (onAction || onCancel || onPrint) && (
            <>
              <Separator />
              <div className="flex gap-2 pb-4">
                {onPrint && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => onPrint(order)}
                  >
                    <Printer className="h-4 w-4 mr-1.5" />
                    Imprimir
                  </Button>
                )}
                {onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onCancel(order)}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Cancelar
                  </Button>
                )}
                {actionLabel && onAction && (
                  <Button
                    size="sm"
                    className="flex-1 cursor-pointer"
                    onClick={() => onAction(order)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Atualizando..." : actionLabel}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
