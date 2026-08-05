import { CATEGORY_MAP } from '@/constants/home-data'
import { useAuthStore } from '@/stores'
import { isCompanyRole } from '@/utils/role-helpers'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook centralizado para gerenciar navegação na aplicação
 */
export function useNavigation() {
  const router = useRouter()
  const { user } = useAuthStore()

  const navigateToHome = useCallback(() => {
    router.push("/")
  }, [router])

  const navigateToRestaurants = useCallback(() => {
    router.push("/restaurants")
  }, [router])

  const navigateToOffers = useCallback(() => {
    router.push("/restaurants?filter=ofertas")
  }, [router])

  const navigateToCart = useCallback(() => {
    router.push("/cart")
  }, [router])

  const navigateToProfile = useCallback(() => {
    // Redirect based on user role - company roles go to company-profile
    if (isCompanyRole(user?.role)) {
      router.push("/company-profile")
    } else {
      router.push("/profile")
    }
  }, [router, user])

  const navigateToRestaurant = useCallback((restaurantId: number, restaurantName?: string) => {
    if (restaurantName) {
    }
    router.push(`/restaurant/${restaurantId}`)
  }, [router])

  const navigateToCategory = useCallback((categoryName: string) => {
    const categoryValue = CATEGORY_MAP[categoryName] || categoryName.toLowerCase()
    router.push(`/restaurants?category=${categoryValue}`)
  }, [router])

  const navigateToFilter = useCallback((filterLabel: string) => {
    const filterValue = filterLabel.toLowerCase().replace(/\s+/g, "-")
    router.push(`/restaurants?filter=${filterValue}`)
  }, [router])

  const navigateToRestaurantsWithFilters = useCallback(() => {
    router.push("/restaurants?view=filters")
  }, [router])

  const navigateToLocation = useCallback((location: string) => {
    if (!location.trim()) {
      return false
    }
    router.push(`/restaurants?location=${encodeURIComponent(location)}`)
    return true
  }, [router])

  return {
    navigateToHome,
    navigateToRestaurants,
    navigateToOffers,
    navigateToCart,
    navigateToProfile,
    navigateToRestaurant,
    navigateToCategory,
    navigateToFilter,
    navigateToRestaurantsWithFilters,
    navigateToLocation,
  }
}
