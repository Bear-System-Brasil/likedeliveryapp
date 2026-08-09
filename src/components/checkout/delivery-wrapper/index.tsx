"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useCartActions, useCheckoutProcess } from "@/hooks";

import { useAuth } from "@/contexts/auth-provider";

import { ArrowLeft, ShieldCheck, Store, ThumbsUp } from "lucide-react";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { GradientButton } from "@/components/ui/gradient-button";

import { DeliveryForm } from "@/components/checkout/delivery-form";
import { OrderSummary } from "@/components/checkout/order-sumary";
import { PaymentMethod } from "@/components/checkout/payment-method";
import { MainHeader } from "@/components/main-header";

export function DeliveryWrapper() {
  const router = useRouter();
  const { isAuthenticated, showAuthModal } = useAuth();
  const { syncCartFromBackend } = useCartActions();
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    userAddresses,
    selectedAddressId,
    addressMode,
    saveAddress,
    loadingAddresses,
    setAddressMode,
    setSaveAddress,
    handleAddressSelect,
    deliveryInfo,
    paymentMethod,
    changeAmount,
    needsChange,
    handleInputChange,
    setPaymentMethod,
    setChangeAmount,
    setNeedsChange,
    subtotal,
    deliveryFee,
    total,
    cartItems,
    restaurant,
    handleSubmitOrder,
    setSelectedAddressId,
    isFormValid,
    isProcessing,
    isNavigating,
  } = useCheckoutProcess();

  useEffect(() => {
    if (
      isAuthenticated &&
      cartItems.length > 0 &&
      !restaurant?.id &&
      !isSyncing
    ) {
      setIsSyncing(true);
      syncCartFromBackend().finally(() => setIsSyncing(false));
    }
  }, [isAuthenticated, cartItems.length, restaurant?.id, isSyncing]);

  useEffect(() => {
    if (!isAuthenticated) {
      showAuthModal();
    }

    if (isProcessing || isSyncing || isNavigating) {
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Seu carrinho esta vazio!");
      router.push("/#lojas");
      return;
    }

    if (!restaurant?.id) {
      toast.error(
        "Erro ao carregar dados do restaurante. Adicione os itens novamente ao carrinho.",
      );
      router.push("/#lojas");
      return;
    }
  }, [
    isAuthenticated,
    showAuthModal,
    cartItems.length,
    restaurant,
    router,
    isProcessing,
    isSyncing,
    isNavigating,
  ]);

  if (!isAuthenticated) {
    return (
      <AnimatedBackground showBlobs={false}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <ThumbsUp className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-950">
              Login necessario
            </h2>
            <p className="mb-6 text-gray-600">
              Voce precisa estar logado para finalizar seu pedido
            </p>
            <GradientButton onClick={() => showAuthModal()}>
              Fazer login
            </GradientButton>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  if (isSyncing) {
    return (
      <AnimatedBackground showBlobs={false}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Store className="h-8 w-8 animate-pulse text-orange-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-950">
              Carregando carrinho...
            </h2>
            <p className="text-gray-600">Sincronizando dados do restaurante</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground showBlobs={false}>
      <MainHeader
        cartItems={cartItems.length}
        onCartClick={() => router.push("/cart")}
        showSearch={false}
        showNav={false}
      />

      <main className="min-h-screen bg-[#F7F7F8] px-3 pb-28 pt-20 sm:px-5 md:pb-12">
        <div className="mx-auto max-w-[1160px]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Voltar para o carrinho"
              onClick={() => router.push("/cart")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E9EAEE] bg-white text-gray-700 shadow-sm transition-colors hover:border-orange-300 hover:text-orange-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <h1 className="text-xl font-extrabold text-gray-950">Checkout</h1>

            <span className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pagamento seguro
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-3">
              <DeliveryForm
                setSelectedAddressId={setSelectedAddressId}
                handleAddressSelect={handleAddressSelect}
                handleInputChange={handleInputChange}
                setAddressMode={setAddressMode}
                setSaveAddress={setSaveAddress}
                selectedAddressId={selectedAddressId}
                loadingAddresses={loadingAddresses}
                userAddresses={userAddresses}
                deliveryInfo={deliveryInfo}
                addressMode={addressMode}
                saveAddress={saveAddress}
              />

              <PaymentMethod
                setPaymentMethod={setPaymentMethod}
                setNeedsChange={setNeedsChange}
                setChangeAmount={setChangeAmount}
                paymentMethod={paymentMethod}
                changeAmount={changeAmount}
                needsChange={needsChange}
                total={total}
              />
            </div>

            <OrderSummary
              handleSubmitOrder={handleSubmitOrder}
              isFormValid={isFormValid}
              isProcessing={isProcessing}
              deliveryFee={deliveryFee}
              restaurant={restaurant}
              cartItems={cartItems}
              subtotal={subtotal}
              total={total}
            />
          </div>
        </div>
      </main>
    </AnimatedBackground>
  );
}
