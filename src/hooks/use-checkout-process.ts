import {
  apiService,
  PaymentMethod,
  PaymentStatus,
  type Address,
} from "@/services/api";
import { useAuthStore, useCartStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserAddresses } from "./use-addresses";

export interface DeliveryInfo {
  name: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  latitude: number | string;
  longitude: number | string;
  reference: string;
  observations: string;
}

interface CardInfo {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

/**
 * Hook completo para gerenciar todo o processo de checkout
 * Incluindo: endereços, formulário, pagamento e criação de pedido
 */
export const useCheckoutProcess = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const cartStore = useCartStore();
  const {
    items: cartItems,
    restaurant,
    orderId: cartOrderId,
    getTotal,
    getSubtotal,
    clearCart,
    setOrderId,
  } = cartStore;

  // Address management
  const { data: userAddresses = [], isLoading: loadingAddresses } =
    useUserAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [addressMode, setAddressMode] = useState<"select" | "new">("select");
  const [saveAddress, setSaveAddress] = useState(true);

  // Form state
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: user?.name || "",
    phone: user?.phone || "",
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    latitude: 0,
    longitude: 0,
    complement: "",
    reference: "",
    observations: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [changeAmount, setChangeAmount] = useState(""); // Troco para dinheiro
  const [needsChange, setNeedsChange] = useState(false);
  const [paymentGatewayUrl, setPaymentGatewayUrl] = useState<string | null>(
    null,
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Calculated values
  const subtotal = getSubtotal();
  const deliveryFee = 0;
  const total = getTotal();

  /**
   * Carrega dados de um endereço no formulário
   */
  const loadAddressData = (address: Address) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      zipCode: address.zipCode,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      latitude: address.latitude ?? 0,
      longitude: address.longitude ?? 0,
      complement: address.complement || "",
      reference: address.reference || "",
    }));
  };

  /**
   * Seleciona um endereço salvo
   */
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = userAddresses.find((a: Address) => a.id === addressId);
    if (address) {
      loadAddressData(address);
    }
  };

  /**
   * Atualiza campo de entrega
   */
  const handleInputChange = (field: string, value: string | number) => {
    setDeliveryInfo((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Atualiza campo de cartão
   */
  const handleCardInputChange = (field: string, value: string) => {
    setCardInfo((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Salva novo endereço do usuário
   */
  const saveNewAddress = async (): Promise<string | null> => {
    try {
      const addressData = {
        zipCode: deliveryInfo.zipCode,
        state: deliveryInfo.state,
        city: deliveryInfo.city,
        neighborhood: deliveryInfo.neighborhood,
        longitude: String(deliveryInfo.longitude),
        latitude: String(deliveryInfo.latitude),
        street: deliveryInfo.street,
        number: deliveryInfo.number,
        complement: deliveryInfo.complement || undefined,
        reference: deliveryInfo.reference || undefined,
        isDefault: false,
      };

      const response = await apiService.address.createUserAddress(addressData);

      if (response.success && response.data) {
        const id = response.data.id;
        setSelectedAddressId(id);
        toast.success("Endereço salvo com sucesso!");
        return id;
      }

      return null;
    } catch (error) {
      console.error("Error saving address:", error);
      return null;
    }
  };

  /**
   * Valida formulário antes de submeter
   */
  const isFormValid = () => {
    const requiredFields =
      deliveryInfo.name &&
      deliveryInfo.phone &&
      deliveryInfo.street &&
      deliveryInfo.number &&
      deliveryInfo.neighborhood &&
      deliveryInfo.city &&
      deliveryInfo.state &&
      deliveryInfo.zipCode;

    // Pagamentos que não precisam de dados adicionais no checkout
    const paymentValid =
      paymentMethod === "cash" ||
      paymentMethod === "pix" ||
      paymentMethod === "credit" ||
      paymentMethod === "debit" ||
      paymentMethod === "bank_transfer";

    // Se é dinheiro e precisa de troco, validar valor
    const changeValid =
      paymentMethod !== "cash" ||
      !needsChange ||
      (changeAmount && parseFloat(changeAmount) > total);

    return requiredFields && paymentValid && changeValid;
  };

  /**
   * Fluxo completo de finalização de pedido
   *
   * IMPORTANTE: Itens já foram adicionados ao carrinho Redis via use-cart-actions
   *
   * Etapas:
   * 1. Salva novo endereço (se necessário)
   * 2. Finaliza pedido (converte carrinho Redis → Order PostgreSQL)
   * 3. Cria registro de pagamento (payment) usando orderId do banco
   * 4. Cria registro de entrega (delivery) usando orderId do banco
   * 5. Redireciona para página de acompanhamento
   * 6. Limpa carrinho local (após delay para evitar redirect indesejado)
   */
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio!");
      router.push("/restaurants");
      return;
    }

    if (!user?.id) {
      toast.error("Você precisa estar logado para finalizar o pedido");
      router.push("/restaurants");
      return;
    }

    if (!restaurant?.id) {
      toast.error(
        "Erro ao identificar o restaurante. Por favor, adicione os itens novamente ao carrinho.",
      );
      clearCart();
      router.push("/restaurants");
      return;
    }

    setIsProcessing(true);

    try {
      // --------------------------------------------------
      // 1️⃣ GARANTIR QUE EXISTE UM ADDRESS
      // --------------------------------------------------

      let deliveryAddressId = selectedAddressId;

      // For "new" address mode: always create address (delivery needs an addressId)
      if (addressMode === "new" && !deliveryAddressId) {
        deliveryAddressId = await saveNewAddress();
      }

      // Fallback: if we still don't have an address, create one
      if (!deliveryAddressId) {
        const newAddressData = {
          zipCode: deliveryInfo.zipCode,
          street: deliveryInfo.street,
          number: deliveryInfo.number,
          neighborhood: deliveryInfo.neighborhood,
          city: deliveryInfo.city,
          state: deliveryInfo.state,
          latitude: String(deliveryInfo.latitude),
          longitude: String(deliveryInfo.longitude),
          isDefault: false,
        };

        const addressResponse =
          await apiService.address.createUserAddress(newAddressData);

        if (addressResponse.success && addressResponse.data?.id) {
          deliveryAddressId = addressResponse.data.id;
        } else {
          throw new Error("Erro ao criar endereço de entrega");
        }
      }

      // --------------------------------------------------
      // 2️⃣ GARANTIR CARRINHO
      // --------------------------------------------------

      let currentOrderId = cartOrderId;

      if (!currentOrderId) {
        const orderData: any = {
          companyId: restaurant.id,
          discount: 0,
          totalShipping: deliveryFee,
          totalValue: total,
          status: "CART",
        };

        const orderResponse = await apiService.orders.openCart(
          user.id,
          orderData,
        );

        if (!orderResponse?.data?.id) {
          throw new Error("Erro ao criar pedido");
        }

        currentOrderId = orderResponse.data.id;
        setOrderId(currentOrderId);
      }

      const finishOrderResponse = await apiService.orders.finishOrder(
        user.id,
        currentOrderId,
      );

      if (!finishOrderResponse.success) {
        throw new Error(
          finishOrderResponse.message || "Erro ao finalizar pedido",
        );
      }

      const finalizedOrder = finishOrderResponse.data as any;
      const finalOrderId = finalizedOrder.id;

      if (!finalOrderId) {
        throw new Error("Erro ao finalizar pedido - ID não encontrado");
      }

      // --------------------------------------------------
      // 3️⃣ PAGAMENTO
      // --------------------------------------------------

      try {
        const paymentData = {
          orderId: finalOrderId,
          customerId: user.id,
          paymentMethod:
            paymentMethod === "credit"
              ? PaymentMethod.CREDIT_CARD
              : paymentMethod === "debit"
                ? PaymentMethod.DEBIT_CARD
                : paymentMethod === "pix"
                  ? PaymentMethod.PIX
                  : paymentMethod === "cash"
                    ? PaymentMethod.CASH
                    : PaymentMethod.BANK_TRANSFER,
          amount: total,
          status: PaymentStatus.PENDING,
        };

        const paymentResponse = await apiService.payments.create(paymentData);

        if (paymentResponse.data && (paymentResponse.data as any).gatewayUrl) {
          setPaymentGatewayUrl((paymentResponse.data as any).gatewayUrl);
        }
      } catch (error) {
        console.error("Erro no pagamento:", error);
      }

      // --------------------------------------------------
      // 4️⃣ DELIVERY (USANDO O MESMO ADDRESS)
      // --------------------------------------------------

      try {
        const deliveryData = {
          orderId: finalOrderId,
          deliveryAddressId: deliveryAddressId,
          observations: deliveryInfo.observations || undefined,
          estimatedTime: "30-40 min",
        };

        await apiService.deliveries.create(deliveryData);
      } catch (error) {
        console.error("Erro no delivery:", error);
      }

      toast.success("Pedido realizado com sucesso!");

      setIsNavigating(true);
      router.push(`/order-status?orderId=${finalOrderId}`);

      setTimeout(() => {
        clearCart();
        setIsNavigating(false);
      }, 1500);
    } catch (error: any) {
      toast.error(
        error.message || "Erro ao processar pedido. Tente novamente.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-select first address when addresses load
  useEffect(() => {
    if (
      addressMode === "select" &&
      userAddresses.length > 0 &&
      !selectedAddressId
    ) {
      const firstAddress = userAddresses[0];
      setSelectedAddressId(firstAddress.id);
      loadAddressData(firstAddress);
    }

    if (userAddresses.length === 0 && !loadingAddresses) {
      setAddressMode("new");
    }
  }, [userAddresses, loadingAddresses, selectedAddressId, addressMode]);

  // Update user info when available
  useEffect(() => {
    if (user) {
      setDeliveryInfo((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  return {
    // Address management
    userAddresses,
    selectedAddressId,
    addressMode,
    saveAddress,
    loadingAddresses,
    setAddressMode,
    setSaveAddress,
    handleAddressSelect,
    loadAddressData,
    setSelectedAddressId,

    // Form state
    deliveryInfo,
    paymentMethod,
    cardInfo,
    changeAmount,
    needsChange,
    paymentGatewayUrl,
    handleInputChange,
    handleCardInputChange,
    setPaymentMethod,
    setChangeAmount,
    setNeedsChange,

    // Calculated values
    subtotal,
    deliveryFee,
    total,
    cartItems,
    restaurant,

    // Actions
    handleSubmitOrder,
    isFormValid,
    isProcessing,
    isNavigating,
  };
};
