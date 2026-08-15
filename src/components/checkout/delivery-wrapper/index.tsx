"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useCartActions, useCheckoutProcess } from "@/hooks";

import { useAuth } from "@/contexts/auth-provider";

import { ArrowLeft, ShieldCheck, Store, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";

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
  const syncAttemptedRef = useRef(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    userAddresses,
    selectedAddressId,
    addressMode,
    saveAddress,
    loadingAddresses,
    setAddressMode,
    setSaveAddress,
    handleAddressSelect,
    orderType,
    setOrderType,
    isDeliveryValid,
    deliveryInfo,
    paymentMethod,
    cardInfo,
    changeAmount,
    needsChange,
    handleInputChange,
    handleCardInputChange,
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

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setDetailsOpen(false);
      return;
    }

    router.push("/cart");
  };

  const handleContinue = () => {
    if (!isDeliveryValid()) {
      toast.error(
        orderType === "pickup"
          ? "Preencha nome e telefone para continuar."
          : "Preencha nome, telefone e endereço para continuar.",
      );
      return;
    }

    setStep(2);
    setDetailsOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error("Verifique os dados de pagamento antes de confirmar.");
      return;
    }

    await handleSubmitOrder();
  };

  // Tenta sincronizar o carrinho apenas UMA vez por montagem.
  // Sem a trava, um 404 (carrinho inexistente no Redis) nunca preenche
  // restaurant.id e o efeito se redispara em loop infinito.
  useEffect(() => {
    if (!isAuthenticated || cartItems.length === 0 || restaurant?.id) return;
    if (syncAttemptedRef.current) return;

    syncAttemptedRef.current = true;
    setIsSyncing(true);
    syncCartFromBackend().finally(() => setIsSyncing(false));
  }, [isAuthenticated, cartItems.length, restaurant?.id]);

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

      <main className="min-h-screen bg-[#F7F7F8] px-3 pb-40 pt-20 sm:px-5">
        <div className="mx-auto max-w-[640px]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Voltar"
              onClick={handleBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E9EAEE] bg-white text-gray-700 shadow-sm transition-colors hover:border-orange-300 hover:text-orange-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-gray-950">Checkout</h1>
              {restaurant?.name && (
                <p className="truncate text-xs font-semibold text-gray-500">
                  {restaurant.name}
                </p>
              )}
            </div>

            <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pagamento seguro
            </span>
          </div>

          <div className="mb-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                "flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold transition-colors",
                step === 1
                  ? "bg-gray-950 text-white"
                  : "bg-[#ECEDF0] text-gray-500 hover:bg-gray-200",
              )}
            >
              1 Entrega
            </button>
            <span className="h-px w-3 shrink-0 bg-[#DDE0E5]" />
            <div
              className={cn(
                "flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold",
                step === 2
                  ? "bg-gray-950 text-white"
                  : "bg-[#ECEDF0] text-gray-500",
              )}
            >
              2 Pagamento
            </div>
          </div>

          {step === 1 ? (
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
              orderType={orderType}
              setOrderType={setOrderType}
              restaurant={restaurant}
            />
          ) : (
            <PaymentMethod
              setPaymentMethod={setPaymentMethod}
              setNeedsChange={setNeedsChange}
              setChangeAmount={setChangeAmount}
              paymentMethod={paymentMethod}
              changeAmount={changeAmount}
              needsChange={needsChange}
              total={total}
              cardInfo={cardInfo}
              handleCardInputChange={handleCardInputChange}
            />
          )}
        </div>
      </main>

      <OrderSummary
        handleSubmitOrder={handleSubmit}
        isProcessing={isProcessing}
        deliveryFee={deliveryFee}
        cartItems={cartItems}
        subtotal={subtotal}
        total={total}
        step={step}
        detailsOpen={detailsOpen}
        onToggleDetails={() => setDetailsOpen((v) => !v)}
        onContinue={handleContinue}
      />
    </AnimatedBackground>
  );
}
