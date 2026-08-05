import { create } from 'zustand'

interface UIState {
  // Modals
  isAuthModalOpen: boolean
  isAddressModalOpen: boolean
  isMenuItemModalOpen: boolean
  isCategoryModalOpen: boolean

  // Loading states
  isGlobalLoading: boolean
  loadingMessage: string | null

  // Modal actions
  openAuthModal: () => void
  closeAuthModal: () => void
  openAddressModal: () => void
  closeAddressModal: () => void
  openMenuItemModal: () => void
  closeMenuItemModal: () => void
  openCategoryModal: () => void
  closeCategoryModal: () => void

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void
  clearLoading: () => void
}

/**
 * Store global para gerenciar estados de UI da aplicação
 * Modais, loading states, etc.
 */
export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isAuthModalOpen: false,
  isAddressModalOpen: false,
  isMenuItemModalOpen: false,
  isCategoryModalOpen: false,
  isGlobalLoading: false,
  loadingMessage: null,

  // Modal actions
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  openAddressModal: () => set({ isAddressModalOpen: true }),
  closeAddressModal: () => set({ isAddressModalOpen: false }),
  openMenuItemModal: () => set({ isMenuItemModalOpen: true }),
  closeMenuItemModal: () => set({ isMenuItemModalOpen: false }),
  openCategoryModal: () => set({ isCategoryModalOpen: true }),
  closeCategoryModal: () => set({ isCategoryModalOpen: false }),

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) =>
    set({ isGlobalLoading: loading, loadingMessage: message || null }),
  clearLoading: () => set({ isGlobalLoading: false, loadingMessage: null }),
}))
