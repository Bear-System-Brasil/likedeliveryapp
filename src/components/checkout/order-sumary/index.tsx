"use client";

import Image from "next/image";

import { formatCurrency } from "@/utils";

import { CheckCircle, Clock, Store } from "lucide-react";

import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

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
  return (
    <div className="lg:col-span-1">
      <GlassCard sticky>
        <GlassCardContent className="p-6">
          {restaurant && (
            <div className="flex items-center space-x-2 mb-6">
              <Store className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-bold text-gray-900">
                {restaurant.name}
              </h3>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Image
                  width={48}
                  height={48}
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-600">Qtd: {item.quantity}</p>
                </div>
                <span className="font-bold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-6 border-t pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Taxa de entrega</span>
              <span className="text-green-600 font-semibold">
                {deliveryFee === 0 ? "Grátis" : formatCurrency(deliveryFee)}
              </span>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Tempo estimado: {restaurant?.time || "30-40 min"}</span>
          </div>

          <div>
            <GradientButton
              onClick={handleSubmitOrder}
              disabled={!isFormValid() || isProcessing}
              isLoading={isProcessing}
              loadingText="Processando..."
              fullWidth
              size="lg"
              className="flex items-center gap-4"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Pedido
            </GradientButton>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Ao confirmar, você concorda com nossos termos de uso e política de
              privacidade.
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
