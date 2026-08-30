/**
 * Camada de dados da tela da cozinha.
 *
 * Único lugar que sabe como falar com o backend. O hook `use-kitchen-orders`
 * só orquestra TanStack Query em cima destas funções — trocar polling por
 * websocket, ou o mock pela API real, não encosta em nenhum componente.
 */

import { apiService } from "@/services/api";
import { mockFetchOrdersByStatus } from "@/mocks/mock-orders";
import type {
  KitchenOrder,
  KitchenOrdersPage,
  KitchenStatus,
} from "@/components/kitchen/types";

/**
 * Enquanto o ambiente não tem pedidos de verdade, ligue
 * `NEXT_PUBLIC_KITCHEN_MOCK=true`. O switch vive aqui de propósito: nem o hook
 * nem os componentes precisam saber que existe mock.
 */
const USE_MOCK = process.env.NEXT_PUBLIC_KITCHEN_MOCK === "true";

export class KitchenApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "KitchenApiError";
    this.status = status;
  }
}

/** Mensagens dos erros previstos no contrato, por status + pista da mensagem. */
export function toKitchenErrorMessage(error: unknown): string {
  const status = error instanceof KitchenApiError ? error.status : undefined;
  const raw = error instanceof Error ? error.message.toLowerCase() : "";

  if (status === 403) return "Este pedido é de outra empresa.";
  if (status === 404) return "Pedido não encontrado. A tela vai se atualizar.";

  if (status === 400) {
    if (raw.includes("motivo") || raw.includes("reason")) {
      return "Informe o motivo do cancelamento.";
    }
    return "Transição de status inválida. Confira o pedido na tela.";
  }

  return "Não foi possível concluir a ação. Tente novamente.";
}

interface FetchParams {
  page: number;
  limit: number;
}

/**
 * `GET /order/company/status/:status?page&limit`
 *
 * A resposta chega no envelope `{ data, meta }` dentro de `ApiResponse.data`
 * (ver pagination.md) — desembrulhamos aqui para o hook receber a página pronta.
 */
export async function fetchKitchenOrdersByStatus(
  status: KitchenStatus,
  { page, limit }: FetchParams,
): Promise<KitchenOrdersPage> {
  if (USE_MOCK) return mockFetchOrdersByStatus(status, { page, limit });

  const response = await apiService.orders.getCompanyOrdersByStatus(status, {
    page,
    limit,
  });

  if (!response.success || !response.data) {
    throw new KitchenApiError(
      response.message || "Erro ao carregar pedidos",
      response.status,
    );
  }

  const { data, meta } = response.data;

  return {
    data: (data ?? []) as unknown as KitchenOrder[],
    meta: meta ?? {
      page,
      limit,
      total: data?.length ?? 0,
      totalPages: 1,
    },
  };
}

/** `PATCH /order/:id/status` */
export async function advanceKitchenOrderStatus(
  orderId: string,
  status: KitchenStatus,
): Promise<void> {
  if (USE_MOCK) return;

  const response = await apiService.orders.updateOrderStatus(orderId, status);

  if (!response.success) {
    throw new KitchenApiError(
      response.message || "Erro ao atualizar status",
      response.status,
    );
  }
}

/** `PATCH /order/:id/cancel` — motivo obrigatório. */
export async function cancelKitchenOrder(
  orderId: string,
  reason: string,
): Promise<void> {
  if (!reason.trim()) {
    throw new KitchenApiError("Motivo do cancelamento é obrigatório", 400);
  }

  if (USE_MOCK) return;

  const response = await apiService.orders.cancelOrder(orderId, reason.trim());

  if (!response.success) {
    throw new KitchenApiError(
      response.message || "Erro ao cancelar pedido",
      response.status,
    );
  }
}
