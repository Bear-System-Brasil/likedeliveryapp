"use client"

import { useAuth } from '@/contexts/auth-provider'
import { apiService } from '@/services/api'
import { useEffect, useState } from 'react'

interface OrderHistoryItem {
  id: string
  orderId: string
  status: string
  observations?: string
  estimatedTime?: string
  deliveryAddress?: {
    id: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  order?: {
    id: string
    totalValue: number
    status: string
    created_at: string
    company?: {
      id: string
      name: string
      description?: string
    }
  }
  created_at: string
  updated_at: string
}

export function useOrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const fetchOrderHistory = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiService.deliveries.getCustomerDeliveries()

      const deliveries = (response.data as any) || []

      setOrders(deliveries)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico de pedidos')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrdersByStatus = async (status: string) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await apiService.deliveries.getCustomerDeliveriesByStatus(status)

      const deliveries = (response.data as any) || []

      setOrders(deliveries)
    } catch (err: any) {
      setError(err.message || 'Erro ao filtrar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredOrders = () => {
    let filtered = orders

    const activeStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT']
    const completedStatuses = ['DELIVERED', 'CANCELLED']

    if (filter === 'active') {
      filtered = orders.filter(order => activeStatuses.includes(order.status))
    } else if (filter === 'completed') {
      filtered = orders.filter(order => completedStatuses.includes(order.status))
    }

    // Ordenar do mais recente para o mais antigo
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA // Mais recente primeiro
    })
  }

  const refreshHistory = () => {
    fetchOrderHistory()
  }

  useEffect(() => {
    if (user) {
      fetchOrderHistory()
    }
  }, [user])

  return {
    orders: getFilteredOrders(),
    allOrders: orders,
    loading,
    error,
    filter,
    setFilter,
    refreshHistory,
    fetchOrdersByStatus,
  }
}
