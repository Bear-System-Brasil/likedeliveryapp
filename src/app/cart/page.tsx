"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { MainHeader } from "@/components/main-header";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCartActions, useRestaurant } from "@/hooks";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/utils/format-currency";

function getItemImage(item: any) {
  return item.imageUrl || item.image || "/placeholder.svg";
}

function getItemCustomization(item: any) {
  const instructions =
    item.specialInstructions ||
    item.customizations?.instructions ||
    item.customizations?.specialInstructions;

  if (instructions) return `Obs.: ${instructions}`;

  if (typeof item.customizations === "string") {
    return item.customizations;
  }

  return "";
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
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

  const restaurantId = items[0]?.restaurantId || null;
  const { data: restaurantResponse } = useRestaurant(restaurantId);
  const restaurantData = restaurantResponse as any;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && items.length > 0) {
      syncCartFromBackend().catch(() => {});
    }
  }, [isAuthenticated, items.length]);

  const restaurantName =
    restaurantData?.tradeName ||
    items[0]?.restaurantName ||
    "Restaurante";
  const restaurantImage =
    restaurantData?.logo_url || getItemImage(items[0] || {});
  const restaurantTime = restaurantData?.time || "30-40 min";
  const rawDeliveryFee = Number.parseFloat(
    String(restaurantData?.deliveryFee ?? "0").replace(",", "."),
  );
  const deliveryFee = Number.isFinite(rawDeliveryFee) ? rawDeliveryFee : 0;
  const deliveryDiscount = appliedPromo === "FRETE10" ? Math.min(deliveryFee, 10) : 0;

  const subtotal = totalPrice || 0;
  const promoDiscount = appliedPromo === "PRIMEIRA20" ? subtotal * 0.2 : 0;
  const total = subtotal + deliveryFee - deliveryDiscount - promoDiscount;

  const deliveryLabel = deliveryFee - deliveryDiscount > 0
    ? formatCurrency(deliveryFee - deliveryDiscount)
    : "Grátis";

  const restaurantMeta = useMemo(
    () => [
      { label: restaurantTime, icon: Clock3 },
      { label: deliveryLabel, icon: Truck },
    ],
    [deliveryLabel, restaurantTime],
  );

  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();

    if (code === "PRIMEIRA20" || code === "FRETE10") {
      setAppliedPromo(code);
      setPromoCode("");
      toast.success(
        code === "PRIMEIRA20"
          ? "Cupom aplicado: 20% de desconto"
          : "Cupom aplicado: desconto no frete",
      );
      return;
    }

    toast.error("Código promocional inválido");
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    toast.info("Cupom removido");
  };

  if (!isMounted) {
    return <CartPageSkeleton />;
  }

  if (items.length === 0) {
    return (
      <AnimatedBackground showBlobs={false} className="bg-[#f4f5f7] py-0">
        <MainHeader cartItems={0} showSearch={false} showNav={true} />
        <main className="px-3 pb-16 pt-24 sm:px-5">
          <div className="mx-auto flex min-h-[70vh] max-w-[1160px] items-center justify-center">
            <Card className="w-full max-w-md border-[#e9eaee] bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-xl font-extrabold text-[#14161a]">
                Seu carrinho está vazio
              </h1>
              <p className="mt-2 text-sm text-[#8a8f99]">
                Adicione itens do cardápio para continuar.
              </p>
              <Button
                type="button"
                onClick={() => router.push("/")}
                className="mt-5 h-10 rounded-lg bg-orange-500 px-5 font-bold hover:bg-orange-600"
              >
                Explorar restaurantes
              </Button>
            </Card>
          </div>
        </main>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground showBlobs={false} className="bg-[#f4f5f7] py-0">
      <MainHeader
        cartItems={totalItems}
        onCartClick={() => router.push("/cart")}
        showSearch={false}
        showNav={true}
      />

      <main className="px-3 pb-16 pt-20 sm:px-5 sm:pt-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9eaee] bg-white text-[#3d4149] transition hover:border-gray-300"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[#14161a]">
              Seu carrinho
            </h1>
            <span className="rounded-md bg-[#edeef1] px-2 py-1 text-[11px] font-bold text-[#3d4149]">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </span>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-3">
              <Card className="flex items-center gap-3 border-[#e9eaee] bg-white p-3 shadow-sm">
                <Image
                  width={44}
                  height={44}
                  src={restaurantImage}
                  alt={restaurantName}
                  className="h-11 w-11 shrink-0 rounded-[10px] bg-[#edeef1] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-[#14161a]">
                    {restaurantName}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-[#8a8f99]">
                    {restaurantMeta.map(({ label, icon: Icon }) => (
                      <span key={label} className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                {restaurantId && (
                  <button
                    type="button"
                    onClick={() => router.push("/#lojas")}
                    className="shrink-0 text-xs font-bold text-orange-500 hover:text-orange-600"
                  >
                    Ver lojas
                  </button>
                )}
              </Card>

              {items.map((item) => {
                const customization = getItemCustomization(item);
                const itemTotal = item.price * item.quantity;

                return (
                  <Card
                    key={item.id}
                    className="flex gap-3 border-[#e9eaee] bg-white p-3 shadow-sm"
                  >
                    <Image
                      width={72}
                      height={72}
                      src={getItemImage(item)}
                      alt={item.name}
                      className="h-[72px] w-[72px] shrink-0 rounded-[10px] bg-[#edeef1] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="truncate text-sm font-bold text-[#14161a]">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#8a8f99] transition hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remover ${item.name}`}
                          title={`Remover ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {customization && (
                        <p className="mt-1 truncate text-xs font-medium text-[#8a8f99]">
                          {customization}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[15px] font-extrabold text-[#14161a]">
                          {formatCurrency(itemTotal)}
                        </span>
                        <div className="flex items-center gap-2 rounded-lg bg-[#f4f5f7] p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="h-7 w-7 rounded-md text-[#3d4149] hover:bg-white"
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            title="Diminuir quantidade"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="min-w-5 text-center text-xs font-extrabold text-[#14161a]">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="h-7 w-7 rounded-md text-[#3d4149] hover:bg-white"
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            title="Aumentar quantidade"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </section>

            <aside className="lg:sticky lg:top-24">
              <Card className="border-[#e9eaee] bg-white p-4 shadow-sm">
                <h2 className="text-sm font-extrabold text-[#14161a]">
                  Resumo do pedido
                </h2>

                <div className="mt-4 flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f99]" />
                    <Input
                      value={promoCode}
                      onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applyPromoCode();
                      }}
                      placeholder="Código promocional"
                      className="h-10 rounded-lg border-[#e9eaee] pl-9 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={applyPromoCode}
                    className="h-10 rounded-lg bg-[#14161a] px-3 text-xs font-bold hover:bg-gray-800"
                  >
                    Ativar
                  </Button>
                </div>

                {appliedPromo && (
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[#1b7f4c]">
                    <span>{appliedPromo} aplicado</span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-[#8a8f99] underline hover:text-red-500"
                    >
                      remover
                    </button>
                  </div>
                )}

                <div className="my-4 space-y-3 border-y border-[#e9eaee] py-4 text-xs font-semibold">
                  <div className="flex items-center justify-between text-[#8a8f99]">
                    <span>Subtotal</span>
                    <span className="text-[#14161a]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8a8f99]">
                    <span>Taxa de entrega</span>
                    <span className="text-[#1b7f4c]">{deliveryLabel}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-[#1b7f4c]">
                      <span>Desconto ({appliedPromo})</span>
                      <span>-{formatCurrency(promoDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between gap-3">
                  <span className="text-sm font-bold text-[#3d4149]">Total</span>
                  <span className="text-2xl font-extrabold tracking-[-0.02em] text-[#14161a]">
                    {formatCurrency(Math.max(0, total))}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="mt-4 h-11 w-full rounded-lg bg-orange-500 text-sm font-extrabold hover:bg-orange-600"
                >
                  Finalizar pedido
                </Button>

                <p className="mt-3 text-center text-[11px] font-semibold text-[#8a8f99]">
                  Pix · Cartão · Dinheiro · Vale-refeição
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </AnimatedBackground>
  );
}

function CartPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] pt-24">
      <div className="mx-auto max-w-[1160px] space-y-3 px-3 sm:px-5">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {["a", "b", "c"].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}
