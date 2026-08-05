import { useAuth } from '@/contexts/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Hook para página de unauthorized
 * Gerencia estado de autenticação e montagem
 */
export const useUnauthorizedPage = () => {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleLogin = () => {
    router.push('/?auth=required')
  }

  return {
    user,
    isAuthenticated,
    isMounted,
    handleGoHome,
    handleLogin,
  }
}
