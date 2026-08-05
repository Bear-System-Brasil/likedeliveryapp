import { useAuth } from '@/contexts/auth-provider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Hook customizado para gerenciar ações relacionadas a restaurantes
 * na página principal (navegação, favoritos, filtros, etc)
 */
export const useRestaurantActions = () => {
  const router = useRouter()
  const { showAuthModal } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])

  /**
   * Alterna o status de favorito de um restaurante
   */
  const handleToggleFavorite = (restaurantId: string) => {
    setFavorites((prev) =>
      prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/restaurants?category=${encodeURIComponent(categoryName)}`)
  }
  /**
   * Navega para página de restaurantes com filtro de ação rápida
   */
  const handleQuickAction = (actionLabel: string) => {
    router.push(`/restaurants?filter=${actionLabel.toLowerCase().replace(/\s+/g, "-")}`)
  }

  /**
   * Busca restaurantes pela localização informada
   */
  const handleFindFood = (location: string) => {
    if (!location.trim()) {
      alert("Por favor, digite sua localização")
      return
    }
    router.push(`/restaurants?location=${encodeURIComponent(location)}`)
  }

  /**
   * Navega para a página de detalhes de um restaurante específico
   */
  const handleRestaurantClick = (restaurantId: string, restaurantName?: string) => {
    if (restaurantName) {
    }
    router.push(`/restaurant/${restaurantId}`)
  }

  /**
   * Navega para a página do carrinho
   */
  const handleCartClick = () => {
    router.push("/cart")
  }

  /**
   * Inicia o processo de checkout para um restaurante
   */
  const handleCheckout = (restaurantId: string) => {
    router.push(`/restaurant/${restaurantId}`)
  }

  /**
   * Abre o modal de autenticação na aba de registro
   */
  const handleSignup = () => {
    showAuthModal('register')
  }

  /**
   * Navegação geral entre páginas principais
   */
  const handleNavigation = (page: string) => {

    const routes: Record<string, string> = {
      home: "/",
      restaurantes: "/restaurants",
      ofertas: "/restaurants?filter=ofertas"
    }

    const route = routes[page]
    if (route) {
      router.push(route)
    }
  }

  return {
    favorites,
    handleToggleFavorite,
    handleCategoryClick,
    handleQuickAction,
    handleFindFood,
    handleRestaurantClick,
    handleCartClick,
    handleCheckout,
    handleSignup,
    handleNavigation,
  }
}
