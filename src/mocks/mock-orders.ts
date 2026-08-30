/**
 * Pedidos de mentira para desenvolver a tela da cozinha sem backend.
 *
 * Consumido apenas por `services/kitchen.ts` (que o hook chama) — nenhum
 * componente importa este arquivo. Tipado por `components/kitchen/types.ts`,
 * então se o contrato mudar, o mock quebra no build junto com a tela.
 *
 * Cobertura proposital: observação longa, item com adicionais e variações,
 * pedido sem observação nenhuma, e uma coluna de Concluídos com 30 cards
 * para exercitar paginação e rolagem.
 */

import {
  KITCHEN_PAGE_LIMIT,
  type KitchenOrder,
  type KitchenOrdersPage,
  type KitchenStatus,
} from "@/components/kitchen/types";

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const ordered: KitchenOrder[] = [
  {
    id: "ord-1041",
    orderNumber: 1041,
    status: "ORDERED",
    created_at: minutesAgo(1),
    totalValue: 128.4,
    observations:
      "Cliente é alérgica a castanha — conferir todos os molhos antes de montar. Se o prato do meio não puder sair sem castanha, ligar para ela antes de preparar; ela pediu para não substituir por outro item sem avisar. Entregar tudo junto, na mesma sacola.",
    customer: { id: "c-1", name: "Marina Duarte" },
    payments: [{ id: "p-1", amount: 128.4, paymentMethod: "PIX" }],
    delivery: { id: "d-1", status: "PENDING" },
    orderedItems: [
      {
        id: "i-1",
        productId: "prod-9",
        quantity: 2,
        product: { id: "prod-9", name: "Pizza Margherita" },
        addOns: [
          { id: "a-1", quantity: 1, productAddOns: { description: "Borda de catupiry" } },
          { id: "a-2", quantity: 2, productAddOns: { description: "Extra manjericão" } },
        ],
        variations: [{ id: "v-1", productVariation: { description: "Grande · 12 fatias" } }],
      },
      {
        id: "i-2",
        productId: "prod-3",
        quantity: 1,
        product: { id: "prod-3", name: "Bruschetta italiana" },
        addOns: [{ id: "a-3", quantity: 1, productAddOns: { description: "Sem tomate seco" } }],
      },
      {
        id: "i-3",
        productId: "prod-21",
        quantity: 3,
        product: { id: "prod-21", name: "Refrigerante lata" },
        variations: [{ id: "v-2", productVariation: { description: "Zero açúcar" } }],
      },
    ],
  },
  {
    id: "ord-1040",
    orderNumber: 1040,
    status: "ORDERED",
    created_at: minutesAgo(7),
    totalValue: 61.9,
    customer: { id: "c-2", name: "Rafael Nogueira" },
    payments: [{ id: "p-2", amount: 61.9, paymentMethod: "CREDIT_CARD" }],
    delivery: null,
    orderedItems: [
      {
        id: "i-4",
        productId: "prod-14",
        quantity: 1,
        product: { id: "prod-14", name: "Hambúrguer artesanal" },
        addOns: [
          { id: "a-4", quantity: 1, productAddOns: { description: "Bacon extra" } },
          { id: "a-5", quantity: 1, productAddOns: { description: "Cheddar duplo" } },
        ],
        variations: [{ id: "v-3", productVariation: { description: "Ponto ao ponto" } }],
      },
      {
        id: "i-5",
        productId: "prod-30",
        quantity: 1,
        product: { id: "prod-30", name: "Batata rústica" },
      },
    ],
  },
  {
    id: "ord-1039",
    orderNumber: 1039,
    status: "ORDERED",
    created_at: minutesAgo(23),
    totalValue: 89,
    observations: "Sem cebola.",
    customer: { id: "c-3", name: "Juliana Prado" },
    payments: [{ id: "p-3", amount: 89, paymentMethod: "CASH" }],
    delivery: { id: "d-3", status: "ACCEPTED" },
    orderedItems: [
      {
        id: "i-6",
        productId: "prod-7",
        quantity: 1,
        product: { id: "prod-7", name: "Feijoada completa" },
        variations: [{ id: "v-4", productVariation: { description: "Porção para 2" } }],
      },
    ],
  },
];

const inProduction: KitchenOrder[] = [
  {
    id: "ord-1036",
    orderNumber: 1036,
    status: "IN_PRODUCTION",
    created_at: minutesAgo(12),
    totalValue: 74.5,
    customer: { id: "c-4", name: "Otávio Lins" },
    payments: [{ id: "p-4", amount: 74.5, paymentMethod: "PIX" }],
    delivery: { id: "d-4", status: "PENDING" },
    orderedItems: [
      {
        id: "i-7",
        productId: "prod-11",
        quantity: 2,
        product: { id: "prod-11", name: "Pizza quatro queijos" },
        variations: [{ id: "v-5", productVariation: { description: "Média" } }],
      },
    ],
  },
  {
    id: "ord-1034",
    orderNumber: 1034,
    status: "IN_PRODUCTION",
    created_at: minutesAgo(34),
    totalValue: 152,
    observations: "Pedido de aniversário — mandar vela junto com a sobremesa.",
    customer: { id: "c-5", name: "Camila Ferraz" },
    payments: [{ id: "p-5", amount: 152, paymentMethod: "DEBIT_CARD" }],
    delivery: { id: "d-5", status: "ACCEPTED" },
    orderedItems: [
      {
        id: "i-8",
        productId: "prod-5",
        quantity: 1,
        product: { id: "prod-5", name: "Combinado de sushi 20 peças" },
        addOns: [{ id: "a-6", quantity: 2, productAddOns: { description: "Shoyu extra" } }],
      },
      {
        id: "i-9",
        productId: "prod-18",
        quantity: 2,
        product: { id: "prod-18", name: "Tiramisù clássico" },
      },
    ],
  },
];

const readyForPickup: KitchenOrder[] = [
  {
    id: "ord-1031",
    orderNumber: 1031,
    status: "READY_FOR_PICKUP",
    created_at: minutesAgo(41),
    totalValue: 43.9,
    customer: { id: "c-6", name: "Bruno Sales" },
    payments: [{ id: "p-6", amount: 43.9, paymentMethod: "PIX" }],
    delivery: { id: "d-6", status: "PICKED_UP" },
    orderedItems: [
      {
        id: "i-10",
        productId: "prod-14",
        quantity: 1,
        product: { id: "prod-14", name: "Hambúrguer artesanal" },
      },
    ],
  },
  {
    id: "ord-1029",
    orderNumber: 1029,
    status: "READY_FOR_PICKUP",
    created_at: minutesAgo(55),
    totalValue: 96.2,
    customer: { id: "c-7", name: "Helena Castro" },
    payments: [{ id: "p-7", amount: 96.2, paymentMethod: "CASH" }],
    // Retirada no balcão: sem entrega vinculada — aviso informativo no card.
    delivery: null,
    orderedItems: [
      {
        id: "i-11",
        productId: "prod-9",
        quantity: 2,
        product: { id: "prod-9", name: "Pizza Margherita" },
        addOns: [{ id: "a-7", quantity: 1, productAddOns: { description: "Borda recheada" } }],
        variations: [{ id: "v-6", productVariation: { description: "Grande" } }],
      },
    ],
  },
];

/** 30 concluídos para exercitar contador, paginação e "ver mais". */
const completed: KitchenOrder[] = Array.from({ length: 30 }, (_, index) => {
  const number = 1028 - index;
  return {
    id: `ord-${number}`,
    orderNumber: number,
    status: "COMPLETED" as KitchenStatus,
    created_at: minutesAgo(70 + index * 9),
    totalValue: 38 + ((index * 7) % 90),
    observations: index % 6 === 0 ? "Retirado no balcão." : undefined,
    customer: {
      id: `c-${100 + index}`,
      name: [
        "Ana Beatriz Toledo",
        "Carlos Menezes",
        "Diego Rocha",
        "Elisa Vasques",
        "Fábio Andrade",
        "Gabriela Muniz",
      ][index % 6],
    },
    payments: [
      {
        id: `p-${100 + index}`,
        amount: 38 + ((index * 7) % 90),
        paymentMethod: ["PIX", "CREDIT_CARD", "CASH", "DEBIT_CARD"][index % 4],
      },
    ],
    delivery: index % 3 === 0 ? null : { id: `d-${100 + index}`, status: "PICKED_UP" },
    orderedItems: [
      {
        id: `i-${200 + index}`,
        productId: "prod-9",
        quantity: (index % 3) + 1,
        product: { id: "prod-9", name: "Pizza Margherita" },
      },
    ],
  };
});

const BY_STATUS: Record<KitchenStatus, KitchenOrder[]> = {
  ORDERED: ordered,
  IN_PRODUCTION: inProduction,
  READY_FOR_PICKUP: readyForPickup,
  COMPLETED: completed,
};

/** Devolve uma página no mesmo envelope da API real. */
export async function mockFetchOrdersByStatus(
  status: KitchenStatus,
  { page = 1, limit = KITCHEN_PAGE_LIMIT }: { page?: number; limit?: number } = {},
): Promise<KitchenOrdersPage> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const all = BY_STATUS[status] ?? [];
  const start = (page - 1) * limit;

  return {
    data: all.slice(start, start + limit),
    meta: {
      page,
      limit,
      total: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
    },
  };
}
