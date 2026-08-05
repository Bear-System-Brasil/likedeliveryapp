import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Hook para buscar categorias da empresa autenticada (per-restaurant)
 * Nota: Backend tem bug de ordem de rotas. GET /categories/me nunca é alcançado
 * Workaround: Buscamos GET /categories (com auth) e filtramos por companyId no frontend
 */
export const useCategories = () => {
  const { user } = useAuthStore()

  const companyIdToMatch = user?.companyId || user?.id;

  return useQuery({
    queryKey: ['categories', 'my', companyIdToMatch],
    queryFn: async () => {
      const response = await apiService.getMyCategories()
      if (!response.success || !response.data) {
        throw new Error('Falha ao carregar categorias')
      }

      // Filtrar categorias pela empresa autenticada
      // Como GET /categories retorna todas, precisamos filtrar no frontend
      if (companyIdToMatch && Array.isArray(response.data)) {
        return response.data.filter(
          (category) => category.companyId === companyIdToMatch
        )
      }

      return response.data
    },
    enabled: !!user?.id, // Só executa quando user está logado
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

/**
 * Hook para buscar todas as categorias (público, global)
 */
export const useAllCategories = () => {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await apiService.getAllCategories()
      if (!response.success || !response.data) {
        throw new Error('Falha ao carregar categorias')
      }
      return response.data
    },
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Hook para buscar uma categoria específica
 */
export const useCategory = (categoryId: string | null) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required')

      const response = await apiService.getCategory(categoryId)
      if (!response.success || !response.data) {
        throw new Error('Falha ao carregar categoria')
      }
      return response.data
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para criar uma categoria (company-specific)
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiService.createMyCategory(categoryData)
      if (!response.success) {
        throw new Error('Falha ao criar categoria')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar categoria')
    },
  })
}

/**
 * Hook para atualizar uma categoria (company-specific)
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiService.updateMyCategory(id, data)
      if (!response.success) {
        throw new Error('Falha ao atualizar categoria')
      }
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] })
      toast.success('Categoria atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar categoria')
    },
  })
}

/**
 * Hook para deletar uma categoria (company-specific)
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiService.deleteMyCategory(categoryId)
      if (!response.success) {
        throw new Error('Falha ao deletar categoria')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria deletada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar categoria')
    },
  })
}
