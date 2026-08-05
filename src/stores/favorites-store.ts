import { STORAGE_KEYS } from '@/utils/storage-manager'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favorites: string[]
  addFavorite: (restaurantId: string) => void
  removeFavorite: (restaurantId: string) => void
  toggleFavorite: (restaurantId: string) => void
  isFavorite: (restaurantId: string) => boolean
  clearFavorites: () => void
}

/**
 * Store global para gerenciar restaurantes favoritos
 * Persiste os dados no localStorage
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (restaurantId: string) =>
        set((state) => ({
          favorites: state.favorites.includes(restaurantId)
            ? state.favorites
            : [...state.favorites, restaurantId],
        })),

      removeFavorite: (restaurantId: string) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== restaurantId),
        })),

      toggleFavorite: (restaurantId: string) =>
        set((state) => ({
          favorites: state.favorites.includes(restaurantId)
            ? state.favorites.filter((id) => id !== restaurantId)
            : [...state.favorites, restaurantId],
        })),

      isFavorite: (restaurantId: string) =>
        get().favorites.includes(restaurantId),

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: STORAGE_KEYS.FAVORITES,
      version: 1,
    }
  )
)
