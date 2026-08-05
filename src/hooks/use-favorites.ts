import { useCallback, useEffect, useState } from 'react'

/**
 * Hook para gerenciar favoritos com persistência no localStorage
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial caso não exista no localStorage
 */
export function useFavorites(key: string = 'favorites', initialValue: number[] = []) {
  // Inicializa o estado com o valor do localStorage ou valor inicial
  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error)
      return initialValue
    }
  })

  // Sincroniza com localStorage sempre que favorites mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(favorites))
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error)
      }
    }
  }, [key, favorites])

  // Toggle de favorito
  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    )
  }, [])

  // Adiciona favorito
  const addFavorite = useCallback((id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  // Remove favorito
  const removeFavorite = useCallback((id: number) => {
    setFavorites((prev) => prev.filter((favId) => favId !== id))
  }, [])

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  // Check if is favorite
  const isFavorite = useCallback((id: number) => {
    return favorites.includes(id)
  }, [favorites])

  return {
    favorites,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite,
  }
}
