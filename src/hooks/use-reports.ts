import { apiService, ReportsParams } from '@/services/api'
import { useAuthStore } from '@/stores'
import { useQuery } from '@tanstack/react-query'

function todayRange(): ReportsParams {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

export const useReportsSummary = (params?: ReportsParams) => {
  const { isAuthenticated } = useAuthStore()
  const range = params ?? todayRange()

  return useQuery({
    queryKey: ['reports', 'summary', range],
    queryFn: async () => {
      const response = await apiService.reports.getSummary(range)
      if (!response.success) {
        throw new Error(response.message || 'Erro ao buscar relatório')
      }
      return response.data ?? null
    },
    enabled: !!isAuthenticated,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: false,
  })
}
