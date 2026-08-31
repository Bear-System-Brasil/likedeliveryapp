import { LoadingPage } from "@/components/order-status/loading";
import { OrderInfo, OrderStatus as OrderStatusType } from "@/hooks";
import { formatCurrency, formatPhoneDisplay } from "@/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { OrderStatusTracker } from "../order-status-tracker";

type Props = {
  data: {
    order: OrderInfo | null;
    isRefreshing: boolean;
    secondsUntilRefresh: number;
    refresh: () => void;
    getStatusMessage: (status: OrderStatusType) => string;
  };
};

const CARD = "rounded-[13px] border border-[#e9eaee] bg-white";
const CARD_TITLE =
  "flex items-center gap-[7px] text-[13px] font-extrabold text-[#14161a]";

function summarizeItems(items: OrderInfo["items"]) {
  const totalQuantity = items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

  if (!items.length) return "Itens do pedido";

  const names = items.map((item) => item.name).join(", ");

  return `${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"} · ${names}`;
}

export function OrderStatus({ data }: Props) {
  const router = useRouter();

  if (!data.order) {
    return <LoadingPage />;
  }

  const { order } = data;

  return (
    <div>
      <div className="mb-4 text-center">
        <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[#14161a]">
          Acompanhe seu Pedido
        </h1>
        <p className="mt-[3px] text-xs font-semibold text-[#8a8f99]">
          Pedido #{order.orderNumber}
        </p>
        {data.isRefreshing && (
          <div className="mt-2 flex items-center justify-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin text-[#ff6b00]" />
            <span className="text-xs font-medium text-[#ff6b00]">
              Atualizando...
            </span>
          </div>
        )}
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-3">
          <section
            className={`${CARD} border-t-[3px] p-4 ${
              order.isCanceled ? "border-t-red-500" : "border-t-[#ff6b00]"
            }`}
          >
            <h2 className={CARD_TITLE}>
              <span aria-hidden className="text-[#ff6b00]">
                {order.isCanceled ? "✕" : "⏱"}
              </span>
              Status do Pedido
            </h2>

            {/* Pedido cancelado não tem progresso: a linha do tempo daria a
                entender que ele ainda esta em andamento. */}
            {order.isCanceled ? (
              <div className="mt-4 rounded-[10px] bg-red-50 px-[13px] py-[11px]">
                <p className="text-[12.5px] font-bold text-red-700">
                  Pedido cancelado
                </p>
                <p className="mt-[5px] text-[11.5px] font-semibold text-red-600">
                  Este pedido foi cancelado e não será preparado.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <OrderStatusTracker data={data} />
              </div>
            )}
          </section>

          <section className={`${CARD} p-4`}>
            <h2 className={`${CARD_TITLE} mb-[11px]`}>
              <span aria-hidden>🛵</span>
              Informações de Entrega
            </h2>

            <div className="flex items-start gap-[9px]">
              <span aria-hidden className="mt-px shrink-0">
                📍
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-[#14161a]">
                  {order.customerInfo.name}
                </p>
                <p className="mt-px text-xs font-medium text-[#8a8f99]">
                  {order.customerInfo.address}
                </p>
              </div>
            </div>

            <div className="mt-[9px] flex items-center gap-[9px]">
              <span aria-hidden className="shrink-0">
                📞
              </span>
              <span className="text-[12.5px] font-semibold text-[#3d4149]">
                {formatPhoneDisplay(order.customerInfo.phone)}
              </span>
            </div>

            {order.delivery?.observations && (
              <div className="mt-[11px] border-t border-[#f0f1f4] pt-[9px]">
                <p className="text-[11.5px] font-bold text-[#3d4149]">
                  Observações
                </p>
                <p className="mt-px text-xs font-medium text-[#8a8f99]">
                  {order.delivery.observations}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <section className={`${CARD} p-[14px]`}>
            <h2 className={`${CARD_TITLE} mb-2.5`}>
              <span aria-hidden>📦</span>
              Resumo do Pedido
            </h2>

            <p className="truncate text-[12.5px] font-semibold text-[#3d4149]">
              {summarizeItems(order.items)}
            </p>

            <div className="my-2.5 h-px bg-[#f0f1f4]" />

            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-extrabold text-[#14161a]">
                Total
              </span>
              <span className="text-base font-extrabold tracking-[-0.02em] text-[#14161a]">
                {formatCurrency(order.total)}
              </span>
            </div>
          </section>

          <div className="flex flex-col gap-2 rounded-[13px] bg-[#fff7ed] p-3">
            <button
              type="button"
              onClick={() => router.push("/#lojas")}
              className="h-[38px] rounded-[10px] bg-[#ff6b00] text-[12.5px] font-extrabold text-white transition-colors hover:bg-[#e05a00]"
            >
              Fazer Novo Pedido
            </button>

            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="h-[38px] rounded-[10px] border border-[#ffd9b3] bg-white text-[12.5px] font-extrabold text-[#e05a00] transition-colors hover:bg-[#fff7ed]"
            >
              Ver Meus Pedidos
            </button>
          </div>

          {order.status === "delivered" || order.isCanceled ? (
            <p className="text-center text-[11px] font-semibold text-[#a2a7b0]">
              Pedido finalizado - atualização automática desativada
            </p>
          ) : (
            <button
              type="button"
              onClick={data.refresh}
              disabled={data.isRefreshing}
              className="flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-[#a2a7b0] transition-colors hover:text-[#3d4149] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3 w-3 ${data.isRefreshing ? "animate-spin" : ""}`}
              />
              {data.isRefreshing
                ? "Atualizando..."
                : `Próxima atualização em ${data.secondsUntilRefresh}s`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
