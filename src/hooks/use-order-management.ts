import {
  type ColumnId,
  type CompanyOrder,
  getColumnForOrder,
  ORDER_POLL_INTERVAL,
} from '@/constants/order-management'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores'
import { orderSoundManager } from '@/utils/order-sounds'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderColumns {
  new: CompanyOrder[]
  preparing: CompanyOrder[]
  ready: CompanyOrder[]
  completed: CompanyOrder[]
}

export interface StatusCounts {
  new: number
  preparing: number
  ready: number
  completed: number
  total: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook auxiliar — Timer de tempo decorrido
// ─────────────────────────────────────────────────────────────────────────────

export function useElapsedTimer(interval: number = 60_000) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), interval)
    return () => clearInterval(id)
  }, [interval])

  return tick
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal — useOrderManagement
// ─────────────────────────────────────────────────────────────────────────────

export const useOrderManagement = () => {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  // UI state
  const [activeTab, setActiveTab] = useState<ColumnId>('new')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<CompanyOrder | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CompanyOrder | null>(null)
  const [actionTarget, setActionTarget] = useState<CompanyOrder | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  // Tracking para detecção de novos pedidos
  const prevNewOrderIdsRef = useRef<Set<string>>(new Set())
  const soundAlertActiveRef = useRef(false)
  const initialLoadRef = useRef(true)

  // Timer tick para atualizar tempo decorrido nos cards
  useElapsedTimer(30_000)

  // ─── Fetch de pedidos da empresa ──────────────────────────────────────────

  const {
    data: ordersResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['company-orders'],
    queryFn: async () => {
      const response = await apiService.orders.getCompanyOrders()
      if (!response.success) {
        throw new Error(response.message || 'Erro ao carregar pedidos')
      }
      return response
    },
    refetchInterval: ORDER_POLL_INTERVAL,
    enabled: !!token,
    staleTime: 10_000,
  })

  const orders = useMemo<CompanyOrder[]>(() => {
    if (!ordersResponse?.success || !ordersResponse.data) return []
    return ordersResponse.data as CompanyOrder[]
  }, [ordersResponse])

  // ─── Agrupamento em colunas ────────────────────────────────────────────────

  const columns: OrderColumns = useMemo(() => {
    const grouped: OrderColumns = {
      new: [],
      preparing: [],
      ready: [],
      completed: [],
    }

    for (const order of orders) {
      const column = getColumnForOrder(order)
      if (column === 'canceled') {
        grouped.completed.push(order)
      } else {
        grouped[column].push(order)
      }
    }

    // Novos: mais recentes primeiro (urgência)
    grouped.new.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    // Em preparo: mais antigos primeiro (FIFO)
    grouped.preparing.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    // Prontos: mais antigos primeiro
    grouped.ready.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    // Concluídos: mais recentes primeiro
    grouped.completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return grouped
  }, [orders])

  // ─── Contadores ────────────────────────────────────────────────────────────

  const statusCounts: StatusCounts = useMemo(
    () => ({
      new: columns.new.length,
      preparing: columns.preparing.length,
      ready: columns.ready.length,
      completed: columns.completed.length,
      total: orders.length,
    }),
    [columns, orders],
  )

  // ─── Notificação sonora para novos pedidos ─────────────────────────────────

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      prevNewOrderIdsRef.current = new Set(columns.new.map((o) => o.id))
      return
    }

    const currentNewIds = new Set(columns.new.map((o) => o.id))
    const prevIds = prevNewOrderIdsRef.current

    const hasNewOrders = [...currentNewIds].some((id) => !prevIds.has(id))

    if (hasNewOrders && columns.new.length > 0 && soundEnabled) {
      orderSoundManager.playNewOrderAlert()
      soundAlertActiveRef.current = true
    }

    if (columns.new.length === 0 && soundAlertActiveRef.current) {
      orderSoundManager.stop()
      soundAlertActiveRef.current = false
    }

    prevNewOrderIdsRef.current = currentNewIds
  }, [columns.new, soundEnabled])

  // ─── Controle de som ──────────────────────────────────────────────────────

  const toggleSound = useCallback(() => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    orderSoundManager.setEnabled(newState)
    if (!newState) {
      orderSoundManager.stop()
      soundAlertActiveRef.current = false
    }
  }, [soundEnabled])

  const stopAlert = useCallback(() => {
    orderSoundManager.stop()
    soundAlertActiveRef.current = false
  }, [])

  // ─── Mutation: Avançar status do pedido ───────────────────────────────────

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiService.orders.updateOrderStatus(orderId, status),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['company-orders'] })
        orderSoundManager.playSuccessSound()
        toast.success('Status atualizado com sucesso')
      } else {
        toast.error(response.message || 'Erro ao atualizar status')
      }
    },
    onError: () => {
      toast.error('Erro de conexão ao atualizar status')
    },
  })

  // ─── Mutation: Cancelar pedido ─────────────────────────────────────────────

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiService.orders.cancelOrder(orderId, reason),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['company-orders'] })
        orderSoundManager.playCancelAlert()
        toast.success('Pedido cancelado')
        setCancelTarget(null)
      } else {
        toast.error(response.message || 'Erro ao cancelar pedido')
      }
    },
    onError: () => {
      toast.error('Erro de conexão ao cancelar pedido')
    },
  })

  // ─── Ações ─────────────────────────────────────────────────────────────────

  const advanceOrder = useCallback(
    (orderId: string, nextStatus: string) => {
      stopAlert()
      updateStatusMutation.mutate({ orderId, status: nextStatus })
      setActionTarget(null)
    },
    [updateStatusMutation, stopAlert],
  )

  const cancelOrder = useCallback(
    (orderId: string, reason: string) => {
      cancelMutation.mutate({ orderId, reason })
    },
    [cancelMutation],
  )

  // ─── Audio context resume (política do browser) ────────────────────────────

  useEffect(() => {
    const handler = () => orderSoundManager.resumeContext()
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    return () => {
      orderSoundManager.stop()
    }
  }, [])

  // ─── Retorno ───────────────────────────────────────────────────────────────

  return {
    // Data
    columns,
    statusCounts,
    isLoading,
    isError,
    orders,

    // UI state
    activeTab,
    setActiveTab,
    selectedOrder,
    setSelectedOrder,
    cancelTarget,
    setCancelTarget,
    actionTarget,
    setActionTarget,
    soundEnabled,
    showCompleted,
    setShowCompleted,

    // Actions
    advanceOrder,
    cancelOrder,
    toggleSound,
    stopAlert,
    refetch,

    // Mutation states
    isUpdating: updateStatusMutation.isPending,
    isCanceling: cancelMutation.isPending,
  }
}
