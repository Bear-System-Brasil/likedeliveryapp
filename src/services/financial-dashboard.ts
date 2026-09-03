/**
 * Camada de dados do painel financeiro (/financial-management/dashboard).
 *
 * Único lugar que sabe falar com o backend e fazer as contas do painel. O
 * hook `use-financial-dashboard` só orquestra TanStack Query em cima destas
 * funções, e nenhum componente da tela chama a API.
 *
 * O painel é de leitura: aqui não existe nada que altere dado.
 */

import {
  MAX_PAGE_LIMIT,
  PaymentStatus,
  apiService,
  toPaginated,
  type Payment,
  type ReportsExpenses,
  type ReportsRevenueByStatus,
  type ReportsSummary,
} from "@/services/api";

// ======================
// Período
// ======================

export type DashboardPeriod =
  | "today"
  | "7d"
  | "month"
  | "previous-month"
  | "custom";

export interface DateRange {
  /** ISO 8601 com offset local, inclusivo nas duas pontas. */
  startDate: string;
  endDate: string;
}

/** Só as datas (sem hora) do intervalo personalizado, como vêm do <input>. */
export interface CustomRange {
  from: string;
  to: string;
}

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Hoje",
  "7d": "7 dias",
  month: "Este mês",
  "previous-month": "Mês anterior",
  custom: "Personalizado",
};

export const DEFAULT_PERIOD: DashboardPeriod = "month";

const pad = (value: number) => String(value).padStart(2, "0");

/** Offset local no formato ±HH:MM, para o backend não reinterpretar em UTC. */
function localOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function startOfDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T00:00:00${localOffset(date)}`;
}

function endOfDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T23:59:59.999${localOffset(date)}`;
}

function daysAgo(days: number, from = new Date()): Date {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
}

/** Dia dentro do mês deslocado, sem "31 de fevereiro" virar março. */
function shiftMonth(date: Date, months: number): Date {
  const shifted = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    0,
  ).getDate();
  shifted.setDate(Math.min(date.getDate(), lastDay));
  return shifted;
}

function parseInputDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Intervalo do período escolhido. `custom` incompleto ou invertido cai no
 * padrão em vez de mandar data sem sentido pro backend.
 */
export function getPeriodRange(
  period: DashboardPeriod,
  custom?: CustomRange,
): DateRange {
  const today = new Date();

  if (period === "today") {
    return { startDate: startOfDay(today), endDate: endOfDay(today) };
  }

  if (period === "7d") {
    return { startDate: startOfDay(daysAgo(6)), endDate: endOfDay(today) };
  }

  if (period === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: startOfDay(first), endDate: endOfDay(today) };
  }

  if (period === "previous-month") {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: startOfDay(first), endDate: endOfDay(last) };
  }

  const from = custom?.from ? parseInputDate(custom.from) : null;
  const to = custom?.to ? parseInputDate(custom.to) : null;
  if (!from || !to || from > to) return getPeriodRange(DEFAULT_PERIOD);

  return { startDate: startOfDay(from), endDate: endOfDay(to) };
}

/**
 * Período anterior equivalente, usado só para a variação percentual.
 *
 * Períodos de mês andam um mês no calendário, para comparar mês com mês em
 * vez de "os 31 dias anteriores". Os demais recuam a própria duração,
 * terminando na véspera do início do período atual.
 */
export function getPreviousRange(
  period: DashboardPeriod,
  custom?: CustomRange,
): DateRange {
  const today = new Date();

  if (period === "month") {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { startDate: startOfDay(first), endDate: endOfDay(shiftMonth(today, -1)) };
  }

  if (period === "previous-month") {
    const first = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const last = new Date(today.getFullYear(), today.getMonth() - 1, 0);
    return { startDate: startOfDay(first), endDate: endOfDay(last) };
  }

  const current = getPeriodRange(period, custom);
  const start = new Date(current.startDate);
  const end = new Date(current.endDate);
  // `endDate` é fim do dia, então a diferença já embute o último dia inteiro:
  // arredondar basta, somar 1 daria uma janela um dia maior que a atual.
  const spanDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000),
  );

  return {
    startDate: startOfDay(daysAgo(spanDays, start)),
    endDate: endOfDay(daysAgo(1, start)),
  };
}

// ======================
// Contas do painel
// ======================

/** Variação percentual; `null` quando não há base de comparação. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (!previous) return null;
  return (current - previous) / previous;
}

/** Margem sobre a receita; `null` num período sem receita. */
export function margin(revenue: number, expenses: number): number | null {
  if (!revenue) return null;
  return (revenue - expenses) / revenue;
}

/** Ticket médio; `null` num período sem pedidos. */
export function averageTicket(
  revenue: number,
  orders: number,
): number | null {
  if (!orders) return null;
  return revenue / orders;
}

/** Pedido concluído e pedido cancelado não são receita presa. */
const SETTLED_STATUSES = ["COMPLETED", "CANCELED", "CANCELLED"];

/** O número de receita por status, sob qualquer um dos dois nomes possíveis. */
export function revenueOfStatus(row: ReportsRevenueByStatus): number {
  return row.totalRevenue ?? row.totalOrders ?? 0;
}

/**
 * Venda feita e não realizada: tudo que não fechou nem foi cancelado.
 * Segue a regra literal do contrato - qualquer status fora de COMPLETED e
 * CANCELED entra, inclusive carrinho e abandonado.
 */
export function stuckRevenue(rows?: ReportsRevenueByStatus[]): number {
  if (!rows?.length) return 0;
  return rows
    .filter((row) => !SETTLED_STATUSES.includes(row.status?.toUpperCase()))
    .reduce((sum, row) => sum + revenueOfStatus(row), 0);
}

export interface CancellationRate {
  count: number;
  /** Fração de 0 a 1; `null` se não houve pedido no período. */
  rate: number | null;
}

export function cancellationRate(
  rows?: { status: string; totalOrders: number }[],
): CancellationRate {
  if (!rows?.length) return { count: 0, rate: null };

  const total = rows.reduce((sum, row) => sum + (row.totalOrders ?? 0), 0);
  const count = rows
    .filter((row) => ["CANCELED", "CANCELLED"].includes(row.status?.toUpperCase()))
    .reduce((sum, row) => sum + (row.totalOrders ?? 0), 0);

  return { count, rate: total ? count / total : null };
}

export interface ExpenseSlice {
  key: keyof Omit<ReportsExpenses, "totalExpenses">;
  label: string;
  value: number;
  /** Participação no total, 0 a 1. */
  share: number;
}

const EXPENSE_LABELS: Record<ExpenseSlice["key"], string> = {
  ingredientsCost: "Ingredientes",
  productsCost: "Produtos",
  shippingCost: "Entregas",
  discounts: "Descontos",
};

/** Composição das despesas, da maior para a menor. */
export function expenseBreakdown(expenses?: ReportsExpenses): ExpenseSlice[] {
  if (!expenses) return [];

  const slices = (
    Object.keys(EXPENSE_LABELS) as ExpenseSlice["key"][]
  ).map((key) => ({ key, label: EXPENSE_LABELS[key], value: expenses[key] ?? 0 }));

  // Base é a soma das partes, não `totalExpenses`: se o backend somar algo a
  // mais no total, as barras ainda fecham 100% entre si.
  const base = slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0);

  return slices
    .map((slice) => ({
      ...slice,
      share: base > 0 ? Math.max(slice.value, 0) / base : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Um período sem receita, sem pedido e sem despesa não tem o que mostrar. */
export function isEmptyReport(report?: ReportsSummary | null): boolean {
  if (!report) return true;
  return (
    !report.totalRevenue &&
    !report.totalOrders &&
    !report.totalExpenses?.totalExpenses &&
    !report.revenueByDay?.length &&
    !report.topProducts?.length
  );
}

// ======================
// Busca
// ======================

export class FinancialDashboardError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FinancialDashboardError";
    this.status = status;
  }
}

/** `GET /reports?startDate&endDate` */
export async function fetchReport(range: DateRange): Promise<ReportsSummary> {
  const response = await apiService.reports.getSummary(range);
  if (!response.success || !response.data) {
    throw new FinancialDashboardError(
      response.message || "Não foi possível carregar o relatório do período.",
      response.status,
    );
  }
  return response.data;
}

export interface PendingPayments {
  /** Total de pendentes, de `meta.total`. */
  count: number;
  /** Soma dos valores da página lida. */
  amount: number;
  /** true quando há mais pendentes do que a página somada. */
  partialAmount: boolean;
}

/** `GET /payment?status=PENDING` */
export async function fetchPendingPayments(): Promise<PendingPayments> {
  const params = { page: 1, limit: MAX_PAGE_LIMIT };
  const response = await apiService.payments.findByStatus(
    PaymentStatus.PENDING,
    params,
  );
  if (!response.success || !response.data) {
    throw new FinancialDashboardError(
      response.message || "Não foi possível carregar os pagamentos pendentes.",
      response.status,
    );
  }

  const { items, meta } = toPaginated<Payment>(response.data, params);
  return {
    count: meta.total,
    amount: items.reduce((sum, payment) => sum + (payment.amount ?? 0), 0),
    partialAmount: meta.total > items.length,
  };
}
