import { useConfirm } from "@/contexts/confirm-provider";
import { apiService } from "@/services/api";
import { useCartStore } from "@/stores";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Hook para gerenciar ações do carrinho com integração Backend Redis
 * Sincroniza estado local com carrinho no backend
 */

export const useCartActions = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const {
    items,
    restaurant,
    orderId,
    isLoading,
    setItems,
    setRestaurant,
    setOrderId,
    setLoading,
    clearCart: clearCartLocal,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  // ==== CONTRAMEDIÇAS CONTRA RACE CONDITIONS ====
  // Map para rastrear requisições pendentes por itemId
  const pendingRequests = useRef<Map<string, AbortController>>(new Map());

  // Debounce timers para atualizações de quantidade
  const updateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Busca carrinho do backend e atualiza estado local
   * IMPORTANTE: Erro 404 é ESPERADO quando o usuário não tem carrinho ativo
   * (ex: primeira vez acessando ou após finalizar pedido)
   */
  const syncCartFromBackend = async () => {
    if (!user?.id) return;

    try {
      // Não usar setLoading aqui - sincronização é não-bloqueante

      // Usar viewOrder para APENAS BUSCAR o carrinho existente
      // Não usar openCart aqui porque isso pode sobrescrever o companyId com string vazia
      // A chave cart:${user.id} agora é tratada corretamente pelo encodeOrderId no api.ts
      const cartKey = `cart:${user.id}`;
      const response = await apiService.orders.viewOrder(user.id, cartKey);

      if (response.success && response.data) {
        const backendCart = response.data as any;

        // IMPORTANTE: Manter o prefixo 'cart:' no orderId
        // O backend precisa dele para identificar carrinhos do Redis
        const orderId = backendCart.id;

        setOrderId(orderId);

        // Atualizar restaurant do carrinho no store
        if (backendCart.companyId) {
          setRestaurant({
            id: backendCart.companyId,
            name: restaurant?.name || "Restaurante",
          });
        }

        // Converter itens do backend para formato do store
        if (backendCart.orderedItems && backendCart.orderedItems.length > 0) {
          const cartItems = backendCart.orderedItems.map((item: any) => ({
            id: item.productId,
            name: item.product?.name || "Produto",
            price: item.unitPrice,
            quantity: item.quantity,
            imageUrl: item.product?.imageURL?.[0]?.url,
            restaurantId: backendCart.companyId,
            restaurantName: restaurant?.name || "Restaurante",
            customizations: item.addIngredient || undefined,
          }));
          setItems(cartItems);
        }

        // Validação: Alertar se companyId estiver vazio
        if (!backendCart.companyId) {
          // Empty block - just validation
        }
      }
    } catch (error) {
      // 404 é ESPERADO quando não há carrinho ativo:
      // - Primeira vez que o usuário acessa o app
      // - Após finalizar ou limpar um pedido
      // - Após carrinho expirar no Redis
      // Nestes casos, o carrinho será criado quando adicionar o primeiro item
      // Portanto, este erro pode ser ignorado silenciosamente
    }
    // Sem loading state - sincronização é não-bloqueante
  };

  /**
   * Adiciona um item ao carrinho (backend + local)
   */
  const handleAddToCart = async (item: {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    restaurantId: string;
    restaurantName: string;
    image?: string;
    specialInstructions?: string;
  }) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para adicionar itens ao carrinho");
      return false;
    }

    try {
      setLoading(true);

      // Flag para saber se precisamos criar um novo carrinho
      let needsNewCart = !orderId;

      // Validação: verificar se há itens de outro restaurante
      if (restaurant && restaurant.id !== item.restaurantId) {
        const confirmChange = await confirm({
          title: "Trocar de restaurante?",
          currentRestaurant: restaurant.name,
          newRestaurant: item.restaurantName,
          confirmText: "Sim, limpar carrinho",
          cancelText: "Não, manter atual",
          variant: "danger",
        });

        if (!confirmChange) {
          setLoading(false);
          return false;
        }

        // Limpar carrinho e resetar estado (sem mostrar toast de sucesso)
        await handleClearCart(false);
        // Após limpar, precisamos criar um novo carrinho
        needsNewCart = true;
      }

      // Atualizar restaurant no estado se for novo ou diferente
      if (!restaurant || restaurant.id !== item.restaurantId) {
        setRestaurant({
          id: item.restaurantId,
          name: item.restaurantName,
        });
      }

      // Criar carrinho no backend se necessário
      let currentOrderId = orderId;
      if (needsNewCart) {
        const orderResponse = await apiService.orders.openCart(user.id, {
          companyId: item.restaurantId,
          discount: 0,
          totalShipping: 0,
          totalValue: 0,
          status: "CART",
        });

        if (orderResponse.success && orderResponse.data?.id) {
          currentOrderId = orderResponse.data.id;
          // IMPORTANTE: Não remover o prefixo 'cart:' - o backend precisa dele
          setOrderId(currentOrderId);
        } else {
          throw new Error("Erro ao criar carrinho");
        }
      }

      // Verificar se temos um orderId válido
      if (!currentOrderId) {
        throw new Error("Erro: carrinho não foi criado corretamente");
      }

      // ===== OPTIMISTIC UPDATE =====
      // Adicionar item localmente ANTES da API responder (melhor UX)
      const optimisticItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        imageUrl: item.image,
        specialInstructions: item.specialInstructions,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
      };

      // Verificar se item já existe no carrinho
      const existingItemIndex = items.findIndex((i) => i.id === item.id);
      let newItems;

      if (existingItemIndex >= 0) {
        // Item já existe, aumentar quantidade
        newItems = [...items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + (item.quantity || 1),
        };
      } else {
        // Novo item
        newItems = [...items, optimisticItem];
      }

      // Atualizar estado local imediatamente
      setItems(newItems);
      toast.success(`${item.name} adicionado ao carrinho!`);

      // ===== API CALL EM BACKGROUND =====
      // Fazer requisição ao backend em paralelo (não bloqueia UX)
      // SEM syncCartFromBackend() - economiza 1-2s por operação

      // CONTRAMEDIDA: Cancelar requisição anterior se houver
      if (pendingRequests.current.has(item.id)) {
        pendingRequests.current.get(item.id)?.abort();
      }

      const abortController = new AbortController();
      pendingRequests.current.set(item.id, abortController);

      // Timeout de 10 segundos (previne requisições travadas)
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      const revertAddToCart = (message?: string) => {
        const currentItems = useCartStore.getState().items;
        const revertedItems = currentItems.filter((i) => i.id !== item.id);
        setItems(revertedItems);
        toast.error(message || "Erro ao adicionar item. Tente novamente.");
      };

      apiService.orderItems
        .addProductToCart(currentOrderId, item.id, user.id, item.quantity || 1)
        .then((response) => {
          clearTimeout(timeoutId);
          pendingRequests.current.delete(item.id);

          // A requisição pode resolver normalmente mesmo quando o backend
          // recusa (ex: 403 de permissão) - sem checar `success` o app
          // mantinha o item no carrinho local como se tivesse sido salvo
          if (!response.success) {
            revertAddToCart(response.message);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          pendingRequests.current.delete(item.id);

          // Ignorar erros de abort (esperado)
          if (error.name === "AbortError") return;

          console.error("Erro ao adicionar item:", error);
          revertAddToCart();
        });

      // Retornar true imediatamente (optimistic)
      return true;
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(error.message || "Erro ao adicionar item ao carrinho");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove um item do carrinho (OPTIMISTIC - instantâneo)
   */
  const handleRemoveFromCart = async (itemId: string) => {
    if (!user?.id || !orderId) return;

    // CONTRAMEDIDA: Cancelar requisições pendentes deste item
    if (pendingRequests.current.has(itemId)) {
      pendingRequests.current.get(itemId)?.abort();
      pendingRequests.current.delete(itemId);
    }
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId)!);
      updateTimers.current.delete(itemId);
    }

    // Salvar quantidade para API
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // ===== OPTIMISTIC UPDATE =====
    // Remover item localmente IMEDIATAMENTE
    const newItems = items.filter((i) => i.id !== itemId);
    setItems(newItems);
    toast.success("Item removido do carrinho");

    // ===== API CALL EM BACKGROUND =====
    apiService.orderItems
      .removeProductFromCart(user.id, orderId, itemId, item.quantity)
      .catch((error) => {
        // Reverter se falhar usando estado atual
        console.error("Erro ao remover item:", error);
        const currentItems = useCartStore.getState().items;
        setItems([...currentItems, item]);
        toast.error("Erro ao remover. Tente novamente.");
      });
  };

  /**
   * Atualiza a quantidade de um item (OPTIMISTIC + DEBOUNCED)
   * CONTRAMEDIDA: Debounce de 300ms para evitar múltiplas requisições
   */
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!user?.id || !orderId) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Se nova quantidade é 0 ou negativa, remover item
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    // ===== OPTIMISTIC UPDATE IMEDIATO =====
    const newItems = items.map((i) =>
      i.id === itemId ? { ...i, quantity: newQuantity } : i,
    );
    setItems(newItems);

    // ===== DEBOUNCE: Aguardar 300ms antes de enviar API =====
    // CONTRAMEDIDA: Se usuário clicar múltiplas vezes, só envia a última
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId)!);
    }

    const timer = setTimeout(() => {
      updateTimers.current.delete(itemId);

      // Calcular diferença com base no estado atual do store
      const currentItems = useCartStore.getState().items;
      const currentItem = currentItems.find((i) => i.id === itemId);

      if (!currentItem) return; // Item foi removido

      const diff = currentItem.quantity - item.quantity;
      if (diff === 0) return; // Sem mudanças

      // CONTRAMEDIDA: Cancelar requisição anterior se houver
      if (pendingRequests.current.has(itemId)) {
        pendingRequests.current.get(itemId)?.abort();
      }

      const abortController = new AbortController();
      pendingRequests.current.set(itemId, abortController);

      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      const apiCall =
        diff > 0
          ? apiService.orderItems.addProductToCart(
              orderId,
              itemId,
              user.id,
              diff,
            )
          : apiService.orderItems.removeProductFromCart(
              user.id,
              orderId,
              itemId,
              Math.abs(diff),
            );

      const revertQuantity = (message?: string) => {
        const currentItems = useCartStore.getState().items;
        const revertedItems = currentItems.map((i) =>
          i.id === itemId ? { ...i, quantity: item.quantity } : i,
        );
        setItems(revertedItems);
        toast.error(message || "Erro ao atualizar. Tente novamente.");
      };

      apiCall
        .then((response) => {
          clearTimeout(timeoutId);
          pendingRequests.current.delete(itemId);

          if (!response.success) {
            revertQuantity(response.message);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          pendingRequests.current.delete(itemId);

          // Ignorar erros de abort
          if (error.name === "AbortError") return;

          console.error("Erro ao atualizar quantidade:", error);
          revertQuantity();
        });
    }, 300); // Debounce de 300ms

    updateTimers.current.set(itemId, timer);
  };

  /**
   * Limpa o carrinho (backend + local)
   */
  const handleClearCart = async (showToast: boolean = true) => {
    if (!user?.id || !orderId) {
      clearCartLocal();
      return;
    }

    try {
      setLoading(true);
      await apiService.orders.clearCart(user.id, orderId);
      clearCartLocal();
      if (showToast) {
        toast.success("Carrinho limpo com sucesso");
      }
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error);
      // Limpar local mesmo se der erro no backend
      clearCartLocal();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navega para o checkout
   */
  const handleGoToCheckout = () => {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    router.push("/checkout");
  };

  /**
   * Navega para a página do carrinho
   */
  const handleGoToCart = () => {
    router.push("/cart");
  };

  /**
   * Verifica se um item está no carrinho
   */
  const isItemInCart = (itemId: string): boolean => {
    return items.some((item) => item.id === itemId);
  };

  /**
   * Retorna a quantidade de um item no carrinho
   */
  const getItemQuantity = (itemId: string): number => {
    const item = items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  // Sync cart on mount (non-blocking)
  useEffect(() => {
    if (user?.id && !items.length) {
      syncCartFromBackend().catch(() => {
        // Ignore errors - doesn't block UX
      });
    }
  }, [user?.id]);

  // CLEANUP: Cancelar todas requisições e timers ao desmontar
  // CONTRAMEDIDA: Previne memory leaks e requisições órfãs
  useEffect(() => {
    return () => {
      // Abortar todas requisições pendentes
      pendingRequests.current.forEach((controller) => controller.abort());
      pendingRequests.current.clear();

      // Limpar todos timers de debounce
      updateTimers.current.forEach((timer) => clearTimeout(timer));
      updateTimers.current.clear();
    };
  }, []);

  return {
    items,
    restaurant,
    orderId,
    isLoading,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleGoToCheckout,
    handleGoToCart,
    handleClearCart,
    isItemInCart,
    getItemQuantity,
    syncCartFromBackend,
  };
};
