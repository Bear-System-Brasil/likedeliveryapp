"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Inbox, RefreshCw } from "lucide-react";
import { KitchenOrderCard } from "./order-card";
import type { KitchenColumnState, KitchenOrder } from "./types";

function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-card p-4">
      <div className="flex justify-between">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

interface KitchenColumnProps {
  column: KitchenColumnState;
  highlightedIds: string[];
  advancingOrderId?: string;
  onAdvance: (order: KitchenOrder) => void;
  onCancel: (order: KitchenOrder) => void;
  /** Cabeçalho de coluna aparece só no quadro; nas abas o título já está na aba. */
  showHeader?: boolean;
  className?: string;
}

export function KitchenColumn({
  column,
  highlightedIds,
  advancingOrderId,
  onAdvance,
  onCancel,
  showHeader = true,
  className,
}: KitchenColumnProps) {
  const { config, orders, total, isLoading, isError, hasMore, isLoadingMore } = column;

  return (
    <section
      className={cn("flex h-full min-h-0 flex-col", className)}
      aria-label={config.label}
    >
      {showHeader && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 rounded-t-2xl border px-4 py-3",
            config.tone.header,
          )}
        >
          <h2 className={cn("text-lg font-bold", config.tone.text)}>{config.label}</h2>
          <span
            className={cn(
              "min-w-8 rounded-full px-2.5 py-0.5 text-center text-base font-bold tabular-nums",
              config.tone.badge,
            )}
          >
            {total}
          </span>
        </div>
      )}

      <div
        className={cn(
          // Só esta caixa rola; cabeçalho e contador ficam sempre visíveis.
          "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain border p-3",
          showHeader ? "rounded-b-2xl border-t-0" : "rounded-2xl",
          config.tone.body,
        )}
      >
        {isLoading && (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-base text-muted-foreground">
              Não foi possível carregar esta coluna.
            </p>
            <Button
              variant="outline"
              className="h-12 cursor-pointer text-base"
              onClick={column.refetch}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar de novo
            </Button>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-25" />
            <p className="text-base">{config.emptyMessage}</p>
          </div>
        )}

        {orders.map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            actionLabel={config.actionLabel}
            onAdvance={onAdvance}
            onCancel={onCancel}
            isAdvancing={advancingOrderId === order.id}
            isNew={highlightedIds.includes(order.id)}
          />
        ))}

        {hasMore && (
          <Button
            variant="outline"
            className="h-12 w-full cursor-pointer bg-card text-base"
            onClick={column.loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Carregando..." : "Ver mais"}
          </Button>
        )}
      </div>
    </section>
  );
}
