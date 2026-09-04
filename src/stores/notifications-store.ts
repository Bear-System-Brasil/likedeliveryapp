/**
 * =============================================================================
 * NOTIFICATIONS STORE - CENTRAL DE NOTIFICAÇÕES
 * =============================================================================
 *
 * Lista de notificações do sino global (cliente e gestão). Persiste em
 * localStorage para sobreviver a um refresh, mas é só o feed visual - quem
 * decide SE algo vira notificação é `src/lib/notify.ts`.
 */

import { STORAGE_KEYS } from '@/utils/storage-manager'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationAudience = 'customer' | 'management'

export interface AppNotification {
  id: string
  audience: NotificationAudience
  title: string
  body: string
  /** Rota para onde o clique na notificação deve levar. */
  href?: string
  createdAt: string
  read: boolean
}

/** Feed curto de propósito: isso é um sino, não um histórico de pedidos. */
const MAX_NOTIFICATIONS = 50

interface NotificationsState {
  items: AppNotification[]
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>,
  ) => void
  markAsRead: (id: string) => void
  markAllAsRead: (audience?: NotificationAudience) => void
  clearAll: (audience?: NotificationAudience) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: [],

      addNotification: (notification) =>
        set((state) => ({
          items: [
            {
              ...notification,
              id:
                typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.items,
          ].slice(0, MAX_NOTIFICATIONS),
        })),

      markAsRead: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        })),

      markAllAsRead: (audience) =>
        set((state) => ({
          items: state.items.map((item) =>
            !audience || item.audience === audience
              ? { ...item, read: true }
              : item,
          ),
        })),

      clearAll: (audience) =>
        set((state) => ({
          items: audience
            ? state.items.filter((item) => item.audience !== audience)
            : [],
        })),
    }),
    { name: STORAGE_KEYS.NOTIFICATIONS },
  ),
)
