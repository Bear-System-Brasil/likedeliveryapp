"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useCartActions, useCheckoutProcess } from "@/hooks";

import { useAuth } from "@/contexts/auth-provider";

import { Shield, Store, ThumbsUp } from "lucide-react";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { GradientButton } from "@/components/ui/gradient-button";

import { BackButton } from "@/components/back-button";
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

  // Sincronizar carrinho se não houver restaurant
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

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      showAuthModal();
    }

    // Não redirecionar se estiver processando, sincronizando ou navegando
    if (isProcessing || isSyncing || isNavigating) {
      return;
    }

    // Redirect if cart is empty
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio!");
      router.push("/restaurants");
      return;
    }

    // Redirect if no restaurant data (após tentar sincronizar)
    if (!restaurant?.id) {
      toast.error(
        "Erro ao carregar dados do restaurante. Adicione os itens novamente ao carrinho.",
      );
      router.push("/restaurants");
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-linear-to-br from-orange-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Login Necessário
            </h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para finalizar seu pedido
            </p>
            <GradientButton onClick={() => showAuthModal()}>
              Fazer Login
            </GradientButton>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  // Loading state enquanto sincroniza carrinho
  if (isSyncing) {
    return (
      <AnimatedBackground showBlobs={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-linear-to-br from-orange-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Store className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Carregando carrinho...
            </h2>
            <p className="text-gray-600">Sincronizando dados do restaurante</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground blobCount={2}>
      <MainHeader
        cartItems={cartItems.length}
        onCartClick={() => router.push("/cart")}
        showSearch={false}
        showNav={false}
      />

      <div className="pt-24 pb-32 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Spacing for fixed BackButton */}
          <div className="h-16 sm:h-20 mb-2"></div>

          <BackButton sticky onClick={() => router.push("/cart")} />

          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-gray-900">
                Pagamento Seguro
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Information */}

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

              {/* Payment Method */}

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
            {/* Order Summary */}

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
      </div>
    </AnimatedBackground>
  );
}
