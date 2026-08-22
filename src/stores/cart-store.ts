/**
 * =============================================================================
 * CART STORE - GERENCIAMENTO DE ESTADO DO CARRINHO
 * =============================================================================
 *
 * Store global do carrinho de compras usando Zustand.
 *
 * FEATURES:
 * - Sincronização com backend Redis
 * - Validação: itens de apenas UM restaurante por vez
 * - Estado temporário para UI
 * - Persist apenas orderId para recuperar carrinhos abandonados
 *
 * IMPORTANTE:
 * - O carrinho é gerenciado no BACKEND (Redis)
 * - Este store mantém apenas estado UI temporário
 * - A fonte da verdade é sempre o backend
 * - Use use-cart-actions.ts para operações de carrinho
 *
 * Uso:
 * ```typescript
 * const { items, restaurant, orderId } = useCartStore()
 * ```
 */

import { STORAGE_KEYS } from "@/utils/storage-manager";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface CartItem {
  // Identifica a LINHA do carrinho (produto + combinação exata de tamanho/
  // complementos escolhida) - não o produto em si. Duas linhas do mesmo
  // prato com tamanhos diferentes têm `id`s diferentes, então aparecem
  // separadas e cada uma soma sua própria quantidade.
  id: string;
  // Id real do produto no backend - usado nas chamadas de add/remove/
  // atualizar quantidade, que só entendem productId (não a linha).
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  restaurantId: string;
  restaurantName: string;
  customizations?: Record<string, any>;
  variationLabel?: string;
  addOnLabels?: string[];
  variations?: { productVariationId: string }[];
  addOns?: { productAddOnsId: string; quantity: number }[];
}

export interface Restaurant {
  id: string;
  name: string;
  rating?: number;
  time?: string;
  address?: string;
  deliveryFee?: number;
}

interface CartState {
  items: CartItem[];
  restaurant: Restaurant | null;
  isOpen: boolean;
  orderId: string | null; // ID do pedido no backend (carrinho Redis)
  isLoading: boolean;
  lastSynced: number | null;

  // Computed - agora como funções
  getTotalItems: () => number;
  getTotalPrice: () => number;

  // Actions - APENAS para atualizar estado local
  setItems: (items: CartItem[]) => void;
  setRestaurant: (restaurant: Restaurant | null) => void;
  setOrderId: (orderId: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getSubtotal: () => number;
  getTotal: (deliveryFee?: number) => number;
  markSynced: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        restaurant: null,
        isOpen: false,
        orderId: null,
        isLoading: false,
        lastSynced: null,

        getTotalItems: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },

        getTotalPrice: () => {
          return get().items.reduce(
            (total, item) => total + item.price * item.quantity,
            0,
          );
        },

        getSubtotal: () => {
          return get().items.reduce(
            (total, item) => total + item.price * item.quantity,
            0,
          );
        },

        getTotal: (deliveryFee = 0) => {
          const subtotal = get().getSubtotal();
          return subtotal + deliveryFee;
        },

        setItems: (items) => set({ items }, false, "cart/setItems"),

        setRestaurant: (restaurant) =>
          set({ restaurant }, false, "cart/setRestaurant"),

        setOrderId: (orderId) => set({ orderId }, false, "cart/setOrderId"),

        setLoading: (isLoading) => set({ isLoading }, false, "cart/setLoading"),

        markSynced: () =>
          set({ lastSynced: Date.now() }, false, "cart/markSynced"),

        clearCart: () =>
          set(
            { items: [], orderId: null, restaurant: null, lastSynced: null },
            false,
            "cart/clearCart",
          ),

        toggleCart: () =>
          set((state) => ({ isOpen: !state.isOpen }), false, "cart/toggleCart"),

        openCart: () => set({ isOpen: true }, false, "cart/openCart"),

        closeCart: () => set({ isOpen: false }, false, "cart/closeCart"),
      }),
      {
        name: STORAGE_KEYS.CART_ORDER_ID,
        // Persistir apenas orderId para recuperar carrinhos abandonados
        partialize: (state) => ({
          orderId: state.orderId,
        }),
      },
    ),
    { name: "cart-store", enabled: process.env.NODE_ENV !== "production" },
  ),
);
