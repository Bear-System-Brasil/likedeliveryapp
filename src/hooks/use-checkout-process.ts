import { useSound } from "@/hooks/use-sound";
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

/** Chave do carrinho no Redis: `cart:<customerId>`. Nao e um id de pedido. */
const CART_KEY_PREFIX = "cart:";

function isPersistedOrderId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith(CART_KEY_PREFIX)
  );
}

/**
 * Descobre o id do pedido gravado no banco depois do finishOrder.
 *
 * O carrinho vive no Redis sob `cart:<customerId>` e o pedido concluido ganha
 * UUID proprio. Pagamento e entrega validam UUID, entao mandar a chave do
 * carrinho faz o backend responder 400/403. Quando a resposta do finishOrder
 * vem com a chave do carrinho, buscamos o pedido recem-gravado na listagem
 * do cliente.
 */
async function resolveFinalOrderId(
  finishedOrder: any,
  companyId: string,
): Promise<string | null> {
  const fromResponse = [
    finishedOrder?.id,
    finishedOrder?.orderId,
    finishedOrder?.order?.id,
  ].find(isPersistedOrderId);

  if (fromResponse) return fromResponse;

  const response = await apiService.orders.getCustomerOrders();

  if (!response.success || !Array.isArray(response.data)) return null;

  const [mostRecent] = response.data
    .filter(
      (order) =>
        isPersistedOrderId(order?.id) &&
        order?.status !== "CART" &&
        (!companyId || !order?.companyId || order.companyId === companyId),
    )
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    );

  return mostRecent?.id ?? null;
}

/**
 * Hook completo para gerenciar todo o processo de checkout
 * Incluindo: endereços, formulário, pagamento e criação de pedido
 */
export const useCheckoutProcess = () => {
  const router = useRouter();
  const { play, unlock } = useSound("customer");
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

  // Delivery vs pickup
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");

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
        longitude: Number(deliveryInfo.longitude),
        latitude: Number(deliveryInfo.latitude),
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
   * Valida os dados de entrega (etapa 1 do checkout)
   * Endereço so e obrigatorio quando o pedido e para entrega
   */
  const isDeliveryValid = () => {
    const contactValid = Boolean(deliveryInfo.name && deliveryInfo.phone);

    if (orderType === "pickup") {
      return contactValid;
    }

    return Boolean(
      contactValid &&
      deliveryInfo.street &&
      deliveryInfo.number &&
      deliveryInfo.neighborhood &&
      deliveryInfo.city &&
      deliveryInfo.state &&
      deliveryInfo.zipCode,
    );
  };

  /**
   * Valida formulário antes de submeter
   */
  const isFormValid = () => {
    const requiredFields = isDeliveryValid();

    // Pagamentos que não precisam de dados adicionais no checkout
    const paymentValid =
      paymentMethod === "cash" ||
      paymentMethod === "pix" ||
      paymentMethod === "credit" ||
      paymentMethod === "debit" ||
      paymentMethod === "bank_transfer" ||
      paymentMethod === "card_machine" ||
      paymentMethod === "pix_on_delivery";

    // Se e cartao online, validar dados do cartao
    const cardValid =
      (paymentMethod !== "credit" && paymentMethod !== "debit") ||
      Boolean(
        cardInfo.number.trim() &&
        cardInfo.expiry.trim() &&
        cardInfo.cvv.trim() &&
        cardInfo.name.trim(),
      );

    // Se é dinheiro e precisa de troco, validar valor
    const changeValid =
      paymentMethod !== "cash" ||
      !needsChange ||
      (changeAmount && parseFloat(changeAmount) > total);

    return requiredFields && paymentValid && cardValid && changeValid;
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
    // Este clique é o único gesto garantido antes de a tela de acompanhamento
    // começar a tocar sozinha, no polling. Destravar o áudio aqui é o que faz
    // "em preparo" e "chegou" saírem depois — sem isso o navegador bloqueia
    // tudo em silêncio, porque quem espera o pedido não toca mais na tela.
    unlock();

    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio!");
      router.push("/#lojas");
      return;
    }

    if (!user?.id) {
      toast.error("Você precisa estar logado para finalizar o pedido");
      router.push("/#lojas");
      return;
    }

    if (!restaurant?.id) {
      toast.error(
        "Erro ao identificar o restaurante. Por favor, adicione os itens novamente ao carrinho.",
      );
      clearCart();
      router.push("/#lojas");
      return;
    }

    setIsProcessing(true);

    try {
      // --------------------------------------------------
      // 1️⃣ GARANTIR QUE EXISTE UM ADDRESS (apenas para entrega)
      // --------------------------------------------------

      let deliveryAddressId = selectedAddressId;

      if (orderType === "delivery") {
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
            latitude: Number(deliveryInfo.latitude),
            longitude: Number(deliveryInfo.longitude),
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
      const finalOrderId = await resolveFinalOrderId(
        finalizedOrder,
        restaurant.id,
      );

      // Chegando aqui o pedido ja esta gravado no banco. Sem o UUID nao da para
      // registrar pagamento e entrega, mas cancelar o fluxo seria mentira - o
      // pedido existe e precisa aparecer em "Meus pedidos".
      if (!finalOrderId) {
        toast.warning(
          "Pedido registrado, mas nao conseguimos identificar o numero dele. Confira em Meus pedidos.",
        );
      }

      // --------------------------------------------------
      // 3️⃣ PAGAMENTO
      // --------------------------------------------------

      if (finalOrderId) {
        try {
          const paymentData = {
            orderId: finalOrderId,
            customerId: user.id,
            paymentMethod:
              paymentMethod === "credit"
                ? PaymentMethod.CREDIT_CARD
                : paymentMethod === "debit"
                  ? PaymentMethod.DEBIT_CARD
                  : paymentMethod === "card_machine"
                    ? PaymentMethod.DEBIT_CARD
                    : paymentMethod === "pix"
                      ? PaymentMethod.PIX
                      : paymentMethod === "pix_on_delivery"
                        ? PaymentMethod.PIX
                        : paymentMethod === "cash"
                          ? PaymentMethod.CASH
                          : PaymentMethod.BANK_TRANSFER,
            amount: total,
            status: PaymentStatus.PENDING,
          };

          const paymentResponse = await apiService.payments.create(paymentData);

          // `apiRequest` nao lanca excecao em 4xx - sem checar `success` a falha
          // de pagamento passava batida e o cliente via "pedido realizado".
          if (!paymentResponse.success) {
            toast.error(
              paymentResponse.message ||
                "Pedido criado, mas falhou ao registrar o pagamento.",
            );
          }

          if (
            paymentResponse.data &&
            (paymentResponse.data as any).gatewayUrl
          ) {
            setPaymentGatewayUrl((paymentResponse.data as any).gatewayUrl);
          }
        } catch (error) {
          console.error("Erro no pagamento:", error);
          toast.error("Pedido criado, mas falhou ao registrar o pagamento.");
        }
      }

      // --------------------------------------------------
      // 4️⃣ DELIVERY (USANDO O MESMO ADDRESS) — pulado quando é retirada no local
      // --------------------------------------------------

      if (finalOrderId && orderType === "delivery" && deliveryAddressId) {
        try {
          const deliveryData = {
            orderId: finalOrderId,
            deliveryAddressId: deliveryAddressId,
            observations: deliveryInfo.observations || undefined,
            estimatedTime: "30-40 min",
          };

          const deliveryResponse =
            await apiService.deliveries.create(deliveryData);

          // O pedido ja existe em "Meus pedidos" mesmo sem entrega registrada,
          // mas sem ela nao ha rastreio - a falha precisa aparecer.
          if (!deliveryResponse.success) {
            toast.error(
              deliveryResponse.message ||
                "Pedido criado, mas falhou ao registrar a entrega.",
            );
          }
        } catch (error) {
          console.error("Erro no delivery:", error);
          toast.error("Pedido criado, mas falhou ao registrar a entrega.");
        }
      }

      // O motivo da marca por inteiro, terminando aberto: pico de alívio do
      // cliente e o momento mais raro e mais carregado da jornada dele.
      play("order-confirmed");
      toast.success("Pedido realizado com sucesso!");

      setIsNavigating(true);
      router.push("/orders");

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

    // Delivery vs pickup
    orderType,
    setOrderType,
    isDeliveryValid,

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
