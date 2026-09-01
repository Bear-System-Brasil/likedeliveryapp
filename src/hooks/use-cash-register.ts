import {
  CloseCashRegisterRequest,
  OpenCashRegisterRequest,
} from '@/services/api'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const QUERY_KEY = ['cash-register', 'current']

export const useCashRegister = () => {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await apiService.cashRegister.getCurrentOpen()
      if (!response.success) {
        // 404 means no open register — not an error
        if (response.message?.includes('404') || response.message?.includes('não encontrado')) {
          return null
        }
        throw new Error(response.message || 'Erro ao buscar caixa')
      }
      return response.data ?? null
    },
    enabled: !!isAuthenticated,
    staleTime: 30_000,
    retry: false,
  })
}

export const useOpenCashRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OpenCashRegisterRequest) =>
      apiService.cashRegister.open(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        queryClient.invalidateQueries({ queryKey: ['cash-movement'] })
        toast.success('Caixa aberto com sucesso!')
      } else {
        toast.error(response.message || 'Erro ao abrir caixa')
      }
    },
    onError: () => toast.error('Erro de conexão ao abrir caixa'),
  })
}

export const useCloseCashRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CloseCashRegisterRequest) =>
      apiService.cashRegister.close(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        queryClient.invalidateQueries({ queryKey: ['cash-movement'] })
        toast.success('Caixa fechado com sucesso!')
      } else {
        toast.error(response.message || 'Erro ao fechar caixa')
      }
    },
    onError: () => toast.error('Erro de conexão ao fechar caixa'),
  })
}
