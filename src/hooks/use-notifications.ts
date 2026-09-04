"use client";

import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/browser-notifications";
import {
  useNotificationsStore,
  type NotificationAudience,
} from "@/stores/notifications-store";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Feed do sino para uma audiência (cliente ou gestão) + ações de leitura.
 *
 * O filtro por audiência não pode viver dentro do selector do Zustand: um
 * `.filter()` ali criaria um array novo a cada chamada, e o
 * `useSyncExternalStore` por trás do hook entende isso como "o estado mudou"
 * pra sempre — loop infinito de re-render em todo componente que usa o sino
 * (ou seja, em toda página, já que ele mora no header global). O selector só
 * pode devolver uma referência estável (`state.items`); o filtro roda depois,
 * memoizado.
 */
export function useNotifications(audience: NotificationAudience) {
  const allItems = useNotificationsStore((state) => state.items);
  const items = useMemo(
    () => allItems.filter((item) => item.audience === audience),
    [allItems, audience],
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
