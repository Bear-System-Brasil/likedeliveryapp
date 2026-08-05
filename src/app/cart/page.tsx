"use client";

import { BackButton } from "@/components/back-button";
import { MainHeader } from "@/components/main-header";
import { BottomBar } from "@/components/ui/bottom-bar";
import { Button } from "@/components/ui/button";
import { useCartActions } from "@/hooks";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/utils/format-currency";
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  ShoppingCart,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const {
    items,
    totalItems,
    totalPrice,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleGoToCheckout,
    syncCartFromBackend,
  } = useCartActions();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (items.length > 0) {
      syncCartFromBackend().catch(() => {});
    }
  }, [items.length, syncCartFromBackend]);

  const applyPromoCode = () => {
    const code = promoCode.toLowerCase().trim();
    if (code === "primeira20") {
      setAppliedPromo("PRIMEIRA20");
      setPromoCode("");
      toast.success("🎉 Cupom PRIMEIRA20 aplicado: 20% de desconto!");
    } else if (code === "frete10") {
      setAppliedPromo("FRETE10");
      setPromoCode("");
      toast.success("🚚 Cupom FRETE10 aplicado: R$ 10 off na entrega!");
    } else {
      toast.error("Código promocional inválido");
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    toast.info("Cupom removido");
  };

  const subtotal = totalPrice || 0;
  const deliveryFee = 0;
  const promoDiscount = appliedPromo === "PRIMEIRA20" ? subtotal * 0.2 : 0;
  const total = subtotal + deliveryFee - promoDiscount;

  // Pegando informações do restaurante do primeiro item
  const restaurant = items.length > 0 ? items[0] : null;

  if (!isMounted) return null;

  // Empty State
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MainHeader
          cartItems={0}
          onCartClick={() => {}}
          showSearch={false}
          showNav={true}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-linear-to-br from-orange-100 to-red-100 rounded-[2.5rem] flex items-center justify-center rotate-6 hover:rotate-12 transition-transform">
                <ShoppingCart className="w-16 h-16 text-orange-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">0</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Fome chegando?
            </h3>
            <p className="text-sm text-gray-600 mb-8 max-w-sm">
              Adicione uns petiscos deliciosos e vamos preparar tudo pra você
            </p>
            <button
              onClick={() => router.push("/")}
              className="group bg-linear-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-orange-500/25 transition-all active:scale-95 flex items-center gap-2"
            >
              Explorar Delícias
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        <BottomBar activeTab="cart" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MainHeader
        cartItems={totalItems}
        onCartClick={() => {}}
        showSearch={false}
        showNav={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Seu Pedido</h1>
            <div className="w-7 h-7 bg-linear-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">{totalItems}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Tudo pronto pra ser delicioso</p>
        </div>

        {/* Restaurant Card */}
        {restaurant && (
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <div className="absolute inset-0 bg-linear-to-r from-orange-500/10 to-red-500/10" />
            <div className="relative bg-white/80 backdrop-blur-sm border border-orange-100 p-4 flex items-center gap-3">
              <div className="relative">
                {restaurant.imageUrl ? (
                  <Image
                    src={restaurant.imageUrl}
                    alt={restaurant.restaurantName || "Restaurante"}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-xl object-cover shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-orange-500" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">
                  {restaurant.restaurantName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 text-orange-600" />
                    <span className="font-semibold text-orange-900">
                      20-30 min
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span className="font-semibold text-red-800">2.5 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100"
            >
              {item.imageUrl && (
                <Image
                  width={80}
                  height={80}
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 pr-2">{item.name}</h3>
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {item.customizations?.instructions && (
                  <p className="text-sm text-gray-500 mt-1">
                    Obs: {item.customizations.instructions}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(item.price)}
                  </span>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      −
                    </Button>
                    <span className="font-bold w-6 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 via-red-500/10 to-orange-400/10" />
          <div className="relative bg-white/90 backdrop-blur-sm border-2 border-dashed border-orange-300 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Código promocional</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="PRIMEIRA20"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
              />
              <button
                onClick={applyPromoCode}
                className="px-6 py-3 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
              >
                Ativar
              </button>
            </div>
            {appliedPromo && (
              <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                ✓ {appliedPromo} aplicado
                <button
                  onClick={removePromoCode}
                  className="underline text-xs hover:text-green-700"
                >
                  remover
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resumo do Pedido */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-stone-900 to-neutral-900" />
          <div className="absolute inset-0 bg-linear-to-br from-orange-900/20 to-red-900/20" />
          <div className="relative p-6 text-white">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-orange-200/70">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-200/70">Taxa de entrega</span>
                <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-full">
                  <Flame className="w-3 h-3 text-green-400" />
                  <span className="font-bold text-green-400 text-xs">
                    GRÁTIS
                  </span>
                </div>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Desconto ({appliedPromo})</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-orange-800/40">
              <div className="flex items-center justify-between">
                <span className="text-orange-100/80 font-semibold">Total</span>
                <span className="text-3xl font-bold bg-linear-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Final */}
        <button
          onClick={handleGoToCheckout}
          className="group relative w-full overflow-hidden rounded-2xl shadow-2xl hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-linear-to-r from-orange-500 via-red-500 to-orange-500 bg-size-[200%_100%] animate-gradient" />
          <div className="relative py-5 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-white" />
            <span className="font-bold text-white text-lg">
              Fazer Pedido Agora
            </span>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💳 Pix • Cartão • Dinheiro • Vale-refeição
          </p>
        </div>
      </div>

      <BottomBar activeTab="cart" />
    </div>
  );
}
