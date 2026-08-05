import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Hook para buscar pedidos do usuário/cliente
 */
export const useUserOrders = () => {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['orders', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required')

      // Usando listAbandonedOrders como alternativa temporária
      const response = await apiService.orders.listAbandonedOrders(user.id)
      if (!response?.success || !response?.data) {
        return [] // Retorna array vazio se falhar
      }
      return response.data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 segundos - pedidos são mais dinâmicos
  })
}

/**
 * Hook para buscar pedidos da empresa/restaurante
 */
export const useCompanyOrders = (_companyId?: string | null) => {
  const { token } = useAuthStore()

  return useQuery({
    queryKey: ['orders', 'company'],
    queryFn: async () => {
      const response = await apiService.orders.getCompanyOrders()
      if (!response?.success || !response?.data) return []
      return response.data
    },
    enabled: !!token,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

/**
 * Hook para buscar detalhes de um pedido específico
 * Nota: Aguardando implementação no backend
 */
export const useOrder = (orderId: string | null, customerId?: string) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId || !customerId) return null

      // Usando viewOrder do apiService
      const response = await apiService.orders.viewOrder(customerId, orderId)
      if (!response?.success || !response?.data) {
        return null
      }
      return response.data
    },
    enabled: !!orderId && !!customerId,
    staleTime: 1000 * 30, // 30 segundos
  })
}

/**
 * Hook para criar um pedido
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (orderData: any) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Usando openCart do apiService
      const response = await apiService.orders.openCart(user.id, orderData)
      if (!response?.success) {
        throw new Error('Falha ao criar pedido')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'user', user?.id] })
      toast.success('Pedido criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar pedido')
    },
  })
}

/**
 * Hook para atualizar status de um pedido
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiService.orders.updateOrderStatus(orderId, status)
      if (!response.success) throw new Error(response.message || 'Erro ao atualizar status')
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] })
      toast.success('Status do pedido atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status')
    },
  })
}

/**
 * Hook para cancelar um pedido
 * Nota: API não implementada no backend. Use clearCart como alternativa.
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Usando clearCart como alternativa
      const response = await apiService.orders.clearCart(user.id, orderId)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Pedido cancelado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar pedido')
    },
  })
}
