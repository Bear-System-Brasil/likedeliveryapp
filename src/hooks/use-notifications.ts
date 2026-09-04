"use client";

import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/browser-notifications";
import {
  useNotificationsStore,
  type NotificationAudience,
} from "@/stores/notifications-store";
import { useCallback, useEffect, useState } from "react";

/**
 * Feed do sino para uma audiência (cliente ou gestão) + ações de leitura.
 */
export function useNotifications(audience: NotificationAudience) {
  const items = useNotificationsStore((state) =>
    state.items.filter((item) => item.audience === audience),
  );
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsReadAction = useNotificationsStore(
    (state) => state.markAllAsRead,
  );

  const unreadCount = items.reduce(
    (count, item) => count + (item.read ? 0 : 1),
    0,
  );

  const markAllAsRead = useCallback(
    () => markAllAsReadAction(audience),
    [markAllAsReadAction, audience],
  );

  return { items, unreadCount, markAsRead, markAllAsRead };
}

/**
 * Estado (reativo) da permissão de notificação do navegador + ação de pedir.
 * `Notification.permission` não é observável nativamente, por isso o estado
 * local é resssincronizado a cada pedido de permissão.
 */
export function useBrowserNotificationPermission() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    setPermission(getBrowserNotificationPermission());
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, requestPermission };
}
