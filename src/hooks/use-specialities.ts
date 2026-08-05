import { apiService } from '@/services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Hook para buscar todas as especialidades (tipos de restaurante)
 */
export const useSpecialities = () => {
  return useQuery({
    queryKey: ['specialities'],
    queryFn: async () => {
      const response = await apiService.getAllSpecialities()
      if (!response.success || !response.data) {
        throw new Error('Falha ao carregar especialidades')
      }
      return response.data
    },
    staleTime: 1000 * 60 * 30, // 30 minutos - especialidades raramente mudam
  })
}

/**
 * Hook para buscar empresas por especialidade
 */
export const useCompaniesBySpeciality = (specialityId: string | null) => {
  return useQuery({
    queryKey: ['speciality', specialityId, 'companies'],
    queryFn: async () => {
      if (!specialityId) throw new Error('Speciality ID is required')
      const response = await apiService.getCompaniesBySpeciality(specialityId)
      if (!response.success || !response.data) {
        throw new Error('Falha ao carregar empresas')
      }
      return response.data
    },
    enabled: !!specialityId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Hook para vincular especialidade à empresa autenticada
 */
export const useAssignSpeciality = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (specialityId: string) => {
      const response = await apiService.assignSpecialityToCompany(specialityId)
      if (!response.success) {
        throw new Error('Falha ao vincular especialidade')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant'] })
      queryClient.invalidateQueries({ queryKey: ['specialities'] })
      toast.success('Especialidade vinculada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao vincular especialidade')
    },
  })
}

/**
 * Hook para remover especialidade da empresa autenticada
 */
export const useRemoveSpeciality = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (specialityId: string) => {
      const response = await apiService.removeSpecialityFromCompany(specialityId)
      if (!response.success) {
        throw new Error('Falha ao remover especialidade')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant'] })
      queryClient.invalidateQueries({ queryKey: ['specialities'] })
      toast.success('Especialidade removida com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover especialidade')
    },
  })
}
