"use client";

/**
 * Toda a busca de dados da tela da cozinha vive aqui.
 *
 * A tela recebe colunas prontas e duas ações; não sabe se os dados vêm de
 * polling, de mock ou de websocket. Para migrar para websocket depois, basta
 * trocar o `refetchInterval` por `queryClient.setQueryData` no listener do
 * socket — nenhum componente muda.
 */

import {
  KITCHEN_COLUMNS,
  KITCHEN_PAGE_LIMIT,
  KITCHEN_POLL_INTERVAL,
  KITCHEN_POLL_STAGGER,
  PAGINATED_STATUSES,
  type KitchenColumnState,
  type KitchenOrder,
  type KitchenOrdersPage,
  type KitchenStatus,
} from "@/components/kitchen/types";
import { useSound } from "@/hooks/use-sound";
import {
  advanceKitchenOrderStatus,
  cancelKitchenOrder,
  fetchKitchenOrdersByStatus,
  toKitchenErrorMessage,
} from "@/services/kitchen";
import { useAuthStore, usePreferencesStore } from "@/stores";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type PagedCache = InfiniteData<KitchenOrdersPage, number>;

const queryKeyFor = (status: KitchenStatus) => ["kitchen-orders", status] as const;

/** Quanto tempo o card recém-chegado fica destacado. */
const HIGHLIGHT_MS = 12_000;

/** Redesenha os relógios dos cards sem refazer requisição. */
function useElapsedTicker(interval = 15_000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
}

function flatten(cache?: PagedCache): KitchenOrder[] {
  return cache?.pages.flatMap((page) => page.data) ?? [];
}

/**
 * Uma coluna = uma query paginada em `/order/company/status/:status`.
 * `staggerIndex` só desencontra os relógios das quatro colunas.
 */
function useKitchenColumnQuery(
  status: KitchenStatus,
  staggerIndex: number,
  enabled: boolean,
) {
  return useInfiniteQuery<
    KitchenOrdersPage,
    Error,
    PagedCache,
    readonly unknown[],
    number
  >({
    queryKey: queryKeyFor(status),
    queryFn: ({ pageParam }) =>
      fetchKitchenOrdersByStatus(status, {
        page: pageParam,
        limit: KITCHEN_PAGE_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled,
    // ~10s por coluna, escalonados para as quatro não dispararem juntas.
    refetchInterval: KITCHEN_POLL_INTERVAL + staggerIndex * KITCHEN_POLL_STAGGER,
    // Aba em background não faz polling: a cozinha não precisa gastar rede
    // enquanto ninguém está olhando, e ao voltar o foco a query revalida.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: KITCHEN_POLL_INTERVAL / 2,
  });
}

type ColumnQuery = ReturnType<typeof useKitchenColumnQuery>;

function toColumnState(
  config: (typeof KITCHEN_COLUMNS)[number],
  query: ColumnQuery,
): KitchenColumnState {
  const pages = query.data?.pages ?? [];
  // O contador do cabeçalho vem de `meta.total`, não do que está na tela.
  const meta = pages[pages.length - 1]?.meta;

  return {
    config,
    orders: flatten(query.data),
    total: meta?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    hasMore: !!query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    refetch: () => {
      query.refetch();
    },
  };
}

export function useKitchenOrders() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  const soundEnabled = usePreferencesStore((state) => state.kitchenSoundEnabled);
  const setKitchenSound = usePreferencesStore((state) => state.setKitchenSound);
  const { play, unlock } = useSound("restaurant");

  const [activeStatus, setActiveStatus] = useState<KitchenStatus>("ORDERED");
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const seenIdsRef = useRef<Set<string> | null>(null);

  useElapsedTicker();

  // ─── Uma query por coluna ─────────────────────────────────────────────────
  // Quatro chamadas explícitas, uma por status permitido. Nenhum outro valor do
  // enum de Order é consultado, então nada fora destes quatro chega à tela.
  const enabled = !!isAuthenticated;
  const orderedQuery = useKitchenColumnQuery("ORDERED", 0, enabled);
  const productionQuery = useKitchenColumnQuery("IN_PRODUCTION", 1, enabled);
  const readyQuery = useKitchenColumnQuery("READY_FOR_PICKUP", 2, enabled);
  const completedQuery = useKitchenColumnQuery("COMPLETED", 3, enabled);

  const queryByStatus: Record<KitchenStatus, ColumnQuery> = {
    ORDERED: orderedQuery,
    IN_PRODUCTION: productionQuery,
    READY_FOR_PICKUP: readyQuery,
    COMPLETED: completedQuery,
  };

  // Novos, Em preparo e Prontos mostram tudo: puxam as páginas seguintes
  // sozinhos. Concluídos só avança quando o usuário pede "ver mais".
  useEffect(() => {
    KITCHEN_COLUMNS.forEach(({ status }) => {
      if (PAGINATED_STATUSES.includes(status)) return;
      const query = queryByStatus[status];
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    });
  });

  const columns = Object.fromEntries(
    KITCHEN_COLUMNS.map((config) => [
      config.status,
      toColumnState(config, queryByStatus[config.status]),
    ]),
  ) as Record<KitchenStatus, KitchenColumnState>;

  // ─── Pedido novo: destaque momentâneo + alerta sonoro opcional ─────────────

  const orderedIdsKey = columns.ORDERED.orders.map((order) => order.id).join(",");

  useEffect(() => {
    const currentIds = orderedIdsKey ? orderedIdsKey.split(",") : [];

    // Primeira carga não é novidade: nada pisca nem apita ao abrir a tela.
    if (seenIdsRef.current === null) {
      if (columns.ORDERED.isLoading) return;
      seenIdsRef.current = new Set(currentIds);
      return;
    }

    const fresh = currentIds.filter((id) => !seenIdsRef.current!.has(id));
    seenIdsRef.current = new Set(currentIds);
    if (fresh.length === 0) return;

    setHighlighted((prev) => [...new Set([...prev, ...fresh])]);
    if (soundEnabled) play("new-order");

    const timeout = setTimeout(() => {
      setHighlighted((prev) => prev.filter((id) => !fresh.includes(id)));
    }, HIGHLIGHT_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedIdsKey, columns.ORDERED.isLoading, soundEnabled, play]);

  const toggleSound = useCallback(() => {
    // Destravar o áudio precisa acontecer dentro do gesto do usuário
    // (política de autoplay); ligar o som é exatamente esse gesto.
    if (!soundEnabled) unlock();
    setKitchenSound(!soundEnabled);
  }, [soundEnabled, setKitchenSound, unlock]);

  // ─── Cache: mover pedido entre colunas (update otimista) ───────────────────

  const removeFromColumn = useCallback(
    (status: KitchenStatus, orderId: string) => {
      queryClient.setQueryData<PagedCache>(queryKeyFor(status), (cache) => {
        if (!cache) return cache;
        return {
          ...cache,
          pages: cache.pages.map((page) => ({
            data: page.data.filter((order) => order.id !== orderId),
            meta: { ...page.meta, total: Math.max(0, page.meta.total - 1) },
          })),
        };
      });
    },
    [queryClient],
  );

  const insertIntoColumn = useCallback(
    (status: KitchenStatus, order: KitchenOrder) => {
      queryClient.setQueryData<PagedCache>(queryKeyFor(status), (cache) => {
        if (!cache || cache.pages.length === 0) return cache;
        const [first, ...rest] = cache.pages;
        return {
          ...cache,
          pages: [
            {
              data: [{ ...order, status }, ...first.data],
              meta: { ...first.meta, total: first.meta.total + 1 },
            },
            ...rest.map((page) => ({
              ...page,
              meta: { ...page.meta, total: page.meta.total + 1 },
            })),
          ],
        };
      });
    },
    [queryClient],
  );

  const snapshot = useCallback(
    (statuses: KitchenStatus[]) =>
      statuses.map(
        (status) =>
          [status, queryClient.getQueryData<PagedCache>(queryKeyFor(status))] as const,
      ),
    [queryClient],
  );

  const restore = useCallback(
    (entries: ReadonlyArray<readonly [KitchenStatus, PagedCache | undefined]>) => {
      entries.forEach(([status, cache]) => {
        queryClient.setQueryData(queryKeyFor(status), cache);
      });
    },
    [queryClient],
  );

  // ─── Avançar status ───────────────────────────────────────────────────────

  const advanceMutation = useMutation({
    mutationFn: ({ order, next }: { order: KitchenOrder; next: KitchenStatus }) =>
      advanceKitchenOrderStatus(order.id, next),

    onMutate: async ({ order, next }) => {
      const from = order.status;
      await queryClient.cancelQueries({ queryKey: ["kitchen-orders"] });
      const previous = snapshot([from, next]);

      removeFromColumn(from, order.id);
      insertIntoColumn(next, order);
      setHighlighted((prev) => prev.filter((id) => id !== order.id));

      return { previous };
    },

    onError: (error, _variables, context) => {
      if (context?.previous) restore(context.previous);
      toast.error(toKitchenErrorMessage(error));
    },

    onSettled: (_data, _error, { order, next }) => {
      queryClient.invalidateQueries({ queryKey: queryKeyFor(order.status) });
      queryClient.invalidateQueries({ queryKey: queryKeyFor(next) });
    },
  });

  // ─── Cancelar ─────────────────────────────────────────────────────────────

  const cancelMutation = useMutation({
    mutationFn: ({ order, reason }: { order: KitchenOrder; reason: string }) =>
      cancelKitchenOrder(order.id, reason),

    onMutate: async ({ order }) => {
      await queryClient.cancelQueries({ queryKey: ["kitchen-orders"] });
      const previous = snapshot([order.status]);
      // Cancelado sai do quadro: não é um dos quatro status da cozinha.
      removeFromColumn(order.status, order.id);
      return { previous };
    },

    onSuccess: () => {
      toast.success("Pedido cancelado");
    },

    onError: (error, _variables, context) => {
      if (context?.previous) restore(context.previous);
      toast.error(toKitchenErrorMessage(error));
    },

    onSettled: (_data, _error, { order }) => {
      queryClient.invalidateQueries({ queryKey: queryKeyFor(order.status) });
    },
  });

  const advanceOrder = useCallback(
    (order: KitchenOrder) => {
      const next = KITCHEN_COLUMNS.find((c) => c.status === order.status)?.nextStatus;
      if (!next) return;
      advanceMutation.mutate({ order, next });
    },
    [advanceMutation],
  );

  const cancelOrder = useCallback(
    (order: KitchenOrder, reason: string) => cancelMutation.mutateAsync({ order, reason }),
    [cancelMutation],
  );

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
  }, [queryClient]);

  const isEmptyBoard =
    KITCHEN_COLUMNS.every(({ status }) => columns[status].orders.length === 0) &&
    !columns.ORDERED.isLoading;

  return {
    columns,
    columnOrder: KITCHEN_COLUMNS,
    activeStatus,
    setActiveStatus,
    highlightedIds: highlighted,
    isEmptyBoard,
    isRefreshing: KITCHEN_COLUMNS.some(({ status }) => columns[status].isFetching),
    hasError: KITCHEN_COLUMNS.some(({ status }) => columns[status].isError),
    soundEnabled,
    toggleSound,
    advanceOrder,
    cancelOrder,
    advancingOrderId: advanceMutation.isPending
      ? advanceMutation.variables?.order.id
      : undefined,
    isCanceling: cancelMutation.isPending,
    refetchAll,
  };
}

export type UseKitchenOrders = ReturnType<typeof useKitchenOrders>;
