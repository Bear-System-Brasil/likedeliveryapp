"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKitchenOrders } from "@/hooks/use-kitchen-orders";
import { cn } from "@/lib/utils";
import { Bell, BellOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { CancelKitchenOrderDialog } from "./cancel-kitchen-order-dialog";
import { KitchenColumn } from "./kitchen-column";
import type { KitchenOrder, KitchenStatus } from "./types";

/**
 * Quadro da cozinha. Só compõe o que o hook entrega: nenhuma chamada de API,
 * nenhum mock, nenhuma regra de status aqui.
 */
export default function Kitchen() {
  const {
    columns,
    columnOrder,
    activeStatus,
    setActiveStatus,
    highlightedIds,
    isRefreshing,
    soundEnabled,
    toggleSound,
    advanceOrder,
    cancelOrder,
    advancingOrderId,
    isCanceling,
    refetchAll,
  } = useKitchenOrders();

  const [cancelTarget, setCancelTarget] = useState<KitchenOrder | null>(null);

  const columnProps = (status: KitchenStatus) => ({
    column: columns[status],
    highlightedIds,
    advancingOrderId,
    onAdvance: advanceOrder,
    onCancel: setCancelTarget,
  });

  return (
    // Altura travada na viewport: a página não rola, só o interior das colunas.
    <div className="flex h-[calc(100dvh-52px)] min-h-0 flex-col overflow-hidden">
      {/* Barra de controles — som e atualização manual */}
      <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2">
        <Button
          variant="ghost"
          className="h-11 cursor-pointer gap-2 text-base"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? (
            <>
              <Bell className="h-5 w-5 text-orange-500" />
              Alerta sonoro ligado
            </>
          ) : (
            <>
              <BellOff className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Alerta sonoro desligado</span>
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          className="h-11 cursor-pointer gap-2 text-base"
          onClick={refetchAll}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Telas estreitas: abas com contador */}
      <div className="min-h-0 flex-1 p-3 lg:hidden">
        <Tabs
          value={activeStatus}
          onValueChange={(value) => setActiveStatus(value as KitchenStatus)}
          className="flex h-full min-h-0 flex-col"
        >
          <TabsList className="grid h-auto w-full shrink-0 grid-cols-4 gap-1 p-1">
            {columnOrder.map((config) => (
              <TabsTrigger
                key={config.status}
                value={config.status}
                className={cn(
                  "h-14 cursor-pointer flex-col gap-0.5 text-sm font-semibold",
                  config.tone.tab,
                )}
              >
                <span>{config.shortLabel}</span>
                <span className="text-lg font-bold tabular-nums">
                  {columns[config.status].total}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {columnOrder.map((config) => (
            <TabsContent
              key={config.status}
              value={config.status}
              className="mt-3 flex min-h-0 flex-1 flex-col focus-visible:outline-none"
            >
              <KitchenColumn {...columnProps(config.status)} showHeader={false} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Telas largas: quatro colunas lado a lado */}
      <div className="hidden min-h-0 flex-1 p-4 lg:block">
        <div className="grid h-full min-h-0 grid-cols-4 gap-4">
          {columnOrder.map((config) => (
            <KitchenColumn key={config.status} {...columnProps(config.status)} />
          ))}
        </div>
      </div>

      <CancelKitchenOrderDialog
        order={cancelTarget}
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelOrder}
        isLoading={isCanceling}
      />
    </div>
  );
}
