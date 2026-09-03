"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCashMovementSummary, useCashRegister } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  MAX_PAGE_LIMIT,
  PaymentStatus,
  apiService,
  toPaginated,
  type Payment,
} from "@/services/api";
import { useAuthStore } from "@/stores";
import { formatCurrency } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  LayoutDashboard,
  Lock,
  RefreshCw,
  TriangleAlert,
  Unlock,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const CASH_REGISTER_HREF = "/financial-management/cash-register";
const FINANCE_HREF = "/financial-management/finance";

/**
 * A partir daqui o caixa aparece destacado. Turno mais longo que isso
 * costuma ser caixa que ninguém fechou no fim do expediente, não turno de
 * verdade - e caixa esquecido aberto mistura o movimento de dois dias.
 */
const LONG_SHIFT_HOURS = 12;

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tempo decorrido em horas, ou null se a data não veio/não faz sentido. */
function hoursSince(value?: string): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, (Date.now() - date.getTime()) / 3_600_000);
}

function formatElapsed(hours: number) {
  const totalMinutes = Math.floor(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `há ${m} min`;
  return `há ${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Cartão de leitura: mostra um número e leva para a tela que opera aquilo.
 * O dashboard não executa ação nenhuma - abrir/fechar caixa vive só em
 * /financial-management/cash-register, e aprovar pagamento só em /finance.
 */
function IndicatorCard({
  href,
  icon,
  label,
  value,
  sub,
  action,
  alert = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  action: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3.5 rounded-[13px] border px-4 py-[15px] transition-colors",
        alert
          ? "border-[#F1C9C3] bg-[#FDF4F3] hover:bg-[#FBEAE8]"
          : "border-[#E9EAEE] bg-white hover:bg-[#FAFAFB]",
      )}
    >
      <span
        className={cn(
          "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px]",
          alert ? "bg-[#F7DDD9] text-[#C0392B]" : "bg-[#F4F5F7] text-[#3D4149]",
        )}
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-semibold text-[#8A8F99]">
          {label}
        </div>
        <div
          className={cn(
            "mt-0.5 truncate text-[17px] font-extrabold tracking-tight",
            alert ? "text-[#C0392B]" : "text-[#14161A]",
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] font-semibold text-[#A2A7B0]">
          {sub}
        </div>
      </div>

      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] font-bold text-[#8A8F99] transition-colors group-hover:text-[#3D4149]">
        {action}
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export default function FinancialDashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const {
    data: register,
    isLoading: registerLoading,
    refetch: refetchRegister,
  } = useCashRegister();
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useCashMovementSummary();

  // A rota de pagamento não filtra por status, então o pendente é contado
  // sobre a página mais recente. O rótulo do cartão diz isso quando o total
  // passa da janela, em vez de fingir um número global.
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["financial", "dashboard", "pending-payments"],
    queryFn: async () => {
      const params = { page: 1, limit: MAX_PAGE_LIMIT };
      const response = await apiService.payments.findByFilters({}, params);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Falha ao carregar pagamentos");
      }
      const { items, meta } = toPaginated<Payment>(response.data, params);
      return {
        pending: items.filter((p) => p.status === PaymentStatus.PENDING).length,
        scanned: items.length,
        total: meta.total,
      };
    },
    enabled: !!isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const handleRefresh = () => {
    refetchRegister();
    refetchSummary();
    refetchPayments();
  };

  const isRegisterOpen = !!register;
  // Recalculado a cada render; o resumo do caixa refaz a busca a cada minuto,
  // então o "há Xh" não fica parado na tela.
  const openFor = hoursSince(register?.openedAt);
  const isLongShift = openFor !== null && openFor >= LONG_SHIFT_HOURS;
  const availableBalance = summary?.availableBalance;

  const partialCount =
    payments && payments.total > payments.scanned ? payments.scanned : null;

  return (
    <AdminPageLayout
      title="Dashboard"
      icon={LayoutDashboard}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-64 lg:pr-8"
      actions={
        <Button
          onClick={handleRefresh}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border border-[#E9EAEE] bg-white px-3.5 text-xs font-bold text-[#FF6B00] transition-colors hover:bg-[#FFF7F0]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-3.5 text-[12.5px] font-medium text-[#8A8F99]">
          Situação do dia. As operações ficam nas telas de caixa e financeiro.
        </p>

        <div className="flex flex-col gap-2.5">
          {registerLoading || summaryLoading ? (
            <Skeleton className="h-[86px] w-full rounded-[13px]" />
          ) : isRegisterOpen ? (
            <IndicatorCard
              href={CASH_REGISTER_HREF}
              alert={isLongShift}
              icon={
                isLongShift ? (
                  <TriangleAlert className="h-[19px] w-[19px]" />
                ) : (
                  <Unlock className="h-[19px] w-[19px]" />
                )
              }
              label="Caixa aberto"
              value={
                availableBalance === undefined
                  ? "—"
                  : formatCurrency(availableBalance)
              }
              sub={
                <>
                  Desde {formatTime(register?.openedAt)}
                  {openFor !== null && ` · ${formatElapsed(openFor)}`}
                  {isLongShift && " · aberto há mais de 12 horas"}
                </>
              }
              action="Ir para o caixa"
            />
          ) : (
            <IndicatorCard
              href={CASH_REGISTER_HREF}
              icon={<Lock className="h-[19px] w-[19px]" />}
              label="Caixa"
              value="Fechado"
              sub="Nenhum turno em andamento"
              action="Abrir na tela de caixa"
            />
          )}

          {paymentsLoading ? (
            <Skeleton className="h-[86px] w-full rounded-[13px]" />
          ) : (
            <IndicatorCard
              href={FINANCE_HREF}
              icon={<Wallet className="h-[19px] w-[19px]" />}
              label="Pagamentos pendentes"
              value={payments ? payments.pending : "—"}
              sub={
                payments
                  ? partialCount
                    ? `Nos ${partialCount} pagamentos mais recentes`
                    : "Aguardando aprovação"
                  : "Não foi possível carregar"
              }
              action="Ver no financeiro"
            />
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
