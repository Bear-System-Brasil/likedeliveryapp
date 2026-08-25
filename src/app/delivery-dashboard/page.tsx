"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  Bike,
  CheckCircle2,
  LogOut,
  MapPin,
  Package,
  Phone,
  RefreshCw,
} from "lucide-react";

import ProtectedRoute from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-provider";
import { useDeliveryDriver } from "@/hooks/use-delivery-driver";
import type { Address, Delivery } from "@/services/api";
import { formatCurrency } from "@/utils";

function formatAddress(address?: Address) {
  if (!address) return "Endereço não informado";
  const line1 = [address.street, address.number].filter(Boolean).join(", ");
  const line2 = [address.neighborhood, address.city].filter(Boolean).join(" - ");
  return [line1, address.complement, line2].filter(Boolean).join(" · ");
}

// O include de order/customer não é garantido pelo contrato (delivery.md não
// documenta esse aninhamento) - lê defensivamente, com fallback, em vez de
// assumir a forma exata.
function getRestaurantName(delivery: Delivery) {
  return (delivery.order as any)?.company?.tradeName || "Restaurante";
}

function getCustomerInfo(delivery: Delivery) {
  const customer = (delivery.order as any)?.customer;
  return {
    name: customer?.name || "Cliente",
    phone: customer?.phone as string | undefined,
  };
}

export default function DeliveryDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["delivery"]}>
      <DeliveryDashboardContent />
    </ProtectedRoute>
  );
}

function DeliveryDashboardContent() {
  const { logout } = useAuth();
  const {
    isLoading,
    isError,
    refetch,
    activeDelivery,
    pendingDeliveries,
    soundEnabled,
    toggleSound,
    acceptDelivery,
    isAccepting,
    pickupDelivery,
    isPickingUp,
    deliverDelivery,
    isDelivering,
    cancelDelivery,
    isCanceling,
  } = useDeliveryDriver();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleConfirmCancel = () => {
    if (!activeDelivery || !cancelReason.trim()) return;
    cancelDelivery(
      { id: activeDelivery.id, reason: cancelReason.trim() },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setCancelReason("");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-10">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e9eaee] bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Bike className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[13.5px] font-extrabold text-[#14161a]">
              Minhas entregas
            </p>
            <p className="text-[11px] font-semibold text-[#8a8f99]">
              {activeDelivery
                ? "Corrida em andamento"
                : `${pendingDeliveries.length} disponível${pendingDeliveries.length === 1 ? "" : "eis"}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9eaee] text-[#3d4149] transition hover:bg-[#f4f5f7]"
            aria-label="Atualizar"
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9eaee] text-[#3d4149] transition hover:bg-[#f4f5f7]"
            aria-label={soundEnabled ? "Silenciar alertas" : "Ativar alertas"}
            title={soundEnabled ? "Silenciar alertas" : "Ativar alertas"}
          >
            {soundEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9eaee] text-[#3d4149] transition hover:bg-red-50 hover:text-red-500"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        ) : isError ? (
          <div className="rounded-2xl border border-dashed border-[#ddd] bg-white px-5 py-10 text-center">
            <p className="text-[13px] font-bold text-[#14161a]">
              Não foi possível carregar suas entregas
            </p>
            <Button
              type="button"
              onClick={() => refetch()}
              className="mt-4 h-10 rounded-xl bg-orange-500 px-5 text-sm font-bold hover:bg-orange-600"
            >
              Tentar novamente
            </Button>
          </div>
        ) : activeDelivery ? (
          <ActiveDeliveryCard
            delivery={activeDelivery}
            onPickup={() => pickupDelivery(activeDelivery.id)}
            isPickingUp={isPickingUp}
            onDeliver={() => deliverDelivery(activeDelivery.id)}
            isDelivering={isDelivering}
            onRequestCancel={() => setCancelOpen(true)}
          />
        ) : pendingDeliveries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ddd] bg-white px-5 py-14 text-center">
            <Package className="mx-auto h-10 w-10 text-[#c9cdd4]" />
            <p className="mt-3 text-[13px] font-bold text-[#14161a]">
              Nenhuma entrega disponível
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#8a8f99]">
              Assim que surgir uma corrida por perto, avisamos por aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pendingDeliveries.map((delivery) => (
              <PendingDeliveryCard
                key={delivery.id}
                delivery={delivery}
                onAccept={() => acceptDelivery(delivery.id)}
                isAccepting={isAccepting}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#3d4149]">
              Motivo do cancelamento
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: endereço inacessível, cliente não atende..."
              rows={3}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              className="rounded-xl"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isCanceling || !cancelReason.trim()}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              {isCanceling ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Delivery["status"] }) {
  const config =
    status === "PICKED_UP"
      ? { label: "A caminho", className: "bg-blue-50 text-blue-600" }
      : { label: "Aceita", className: "bg-orange-50 text-orange-600" };

  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ActiveDeliveryCard({
  delivery,
  onPickup,
  isPickingUp,
  onDeliver,
  isDelivering,
  onRequestCancel,
}: {
  delivery: Delivery;
  onPickup: () => void;
  isPickingUp: boolean;
  onDeliver: () => void;
  isDelivering: boolean;
  onRequestCancel: () => void;
}) {
  const customer = getCustomerInfo(delivery);
  const isPickedUp = delivery.status === "PICKED_UP";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e9eaee] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#f0f1f4] px-4 py-3">
        <p className="truncate text-[13px] font-extrabold text-[#14161a]">
          {getRestaurantName(delivery)}
        </p>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8f99]">
              {isPickedUp ? "Entregar em" : "Retirar em (restaurante)"}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-[#14161a]">
              {isPickedUp
                ? formatAddress(delivery.deliveryAddress)
                : getRestaurantName(delivery)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-[#fafafb] px-3 py-2.5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8f99]">
              Cliente
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-[#14161a]">
              {customer.name}
            </p>
          </div>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm"
              aria-label="Ligar para o cliente"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="flex items-center justify-between text-[12px] font-semibold text-[#8a8f99]">
          <span>Pedido #{delivery.orderId.slice(0, 8)}</span>
          <span className="text-[#14161a]">
            {formatCurrency((delivery.order as any)?.totalValue || 0)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#f0f1f4] px-4 py-3.5">
        {!isPickedUp ? (
          <Button
            type="button"
            onClick={onPickup}
            disabled={isPickingUp}
            className="h-11 w-full rounded-xl bg-[#14161a] text-[13.5px] font-extrabold text-white hover:bg-[#2a2d33]"
          >
            {isPickingUp ? "Confirmando..." : "Marquei que coletei o pedido"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onDeliver}
            disabled={isDelivering}
            className="h-11 w-full rounded-xl bg-[#1b7f4c] text-[13.5px] font-extrabold text-white hover:bg-[#166b40]"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isDelivering ? "Confirmando..." : "Marcar como entregue"}
          </Button>
        )}

        {!isPickedUp && (
          <button
            type="button"
            onClick={onRequestCancel}
            className="text-center text-[11.5px] font-bold text-red-500 hover:text-red-600"
          >
            Não consigo fazer essa entrega
          </button>
        )}
      </div>
    </div>
  );
}

function PendingDeliveryCard({
  delivery,
  onAccept,
  isAccepting,
}: {
  delivery: Delivery;
  onAccept: () => void;
  isAccepting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e9eaee] bg-white p-3.5 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Package className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-extrabold text-[#14161a]">
          {getRestaurantName(delivery)}
        </p>
        <p className="truncate text-[11.5px] font-medium text-[#8a8f99]">
          {formatAddress(delivery.deliveryAddress)}
        </p>
      </div>
      <Button
        type="button"
        onClick={onAccept}
        disabled={isAccepting}
        className="h-9 shrink-0 rounded-xl bg-orange-500 px-3.5 text-xs font-extrabold text-white hover:bg-orange-600"
      >
        Aceitar
      </Button>
    </div>
  );
}
