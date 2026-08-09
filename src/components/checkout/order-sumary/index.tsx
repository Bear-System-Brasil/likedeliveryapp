"use client";

import Image from "next/image";

import { formatCurrency } from "@/utils";

import {
  Bike,
  CheckCircle,
  Clock,
  Loader2,
  ShieldCheck,
  Store,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { CartItem, Restaurant } from "@/stores/cart-store";

type Props = {
  handleSubmitOrder: () => Promise<void>;
  isFormValid: () => boolean | string;
  restaurant: Restaurant | null;
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  isProcessing: boolean;
};

export function OrderSummary({
  handleSubmitOrder,
  isFormValid,
  restaurant,
  cartItems,
  subtotal,
  deliveryFee,
  total,
  isProcessing,
}: Props) {
  const restaurantImage = cartItems.find((item) => item.imageUrl)?.imageUrl;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const canSubmit = Boolean(isFormValid()) && !isProcessing;

  return (
    <aside className="lg:sticky lg:top-[84px]">
      <section className="rounded-lg border border-[#E9EAEE] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#E9EAEE] pb-3">
          {restaurantImage ? (
            <Image
              width={36}
              height={36}
              src={restaurantImage}
              alt={restaurant?.name || "Restaurante"}
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Store className="h-4 w-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-extrabold text-gray-950">
              {restaurant?.name || "Seu pedido"}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Entrega em {restaurant?.time || "30-40 min"}
            </div>
          </div>
        </div>

        <div className="space-y-2 border-b border-[#E9EAEE] py-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-[#F4F5F7] px-1.5 text-xs font-extrabold text-gray-700">
                {item.quantity}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
                {item.name}
              </span>
              <span className="shrink-0 text-sm font-bold text-gray-950">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-b border-[#E9EAEE] py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-500">
              Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})
            </span>
            <span className="font-bold text-gray-950">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
              <Bike className="h-4 w-4 text-orange-500" />
              Taxa de entrega
            </span>
            <span className="font-extrabold text-emerald-700">
              {deliveryFee === 0 ? "Gratis" : formatCurrency(deliveryFee)}
            </span>
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-3">
          <span className="text-sm font-extrabold text-gray-950">Total</span>
          <span className="text-2xl font-extrabold text-gray-950">
            {formatCurrency(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmitOrder}
          disabled={!canSubmit}
          className={cn(
            "mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,.28)] transition-colors",
            canSubmit ? "hover:bg-orange-600" : "cursor-not-allowed opacity-50",
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Confirmar pedido
            </>
          )}
        </button>

        <div className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] font-medium leading-4 text-gray-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Ao confirmar, voce concorda com os termos de uso e a politica de
            privacidade.
          </p>
        </div>
      </section>
    </aside>
  );
}
