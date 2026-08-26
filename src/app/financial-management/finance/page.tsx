"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayment } from "@/hooks";
import { cn } from "@/lib/utils";
import { Payment, PaymentMethod, PaymentStatus } from "@/services/api";
import { formatCurrency } from "@/utils";
import { DollarSign, Search } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

const PAY_METHOD_OPTIONS: { value: PaymentMethod | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os métodos" },
  { value: PaymentMethod.PIX, label: "PIX" },
  { value: PaymentMethod.CREDIT_CARD, label: "Cartão de Crédito" },
  { value: PaymentMethod.DEBIT_CARD, label: "Cartão de Débito" },
  { value: PaymentMethod.CASH, label: "Dinheiro" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Transferência" },
];

const PAY_STATUS_OPTIONS: { value: PaymentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: PaymentStatus.PENDING, label: "Pendente" },
  { value: PaymentStatus.COMPLETED, label: "Concluído" },
  { value: PaymentStatus.FAILED, label: "Falhado" },
  { value: PaymentStatus.CANCELLED, label: "Cancelado" },
  { value: PaymentStatus.REFUNDED, label: "Reembolsado" },
];

const STATUS_BADGE: Record<PaymentStatus, string> = {
  [PaymentStatus.COMPLETED]: "bg-[#E9F7EF] text-[#1B7F4C]",
  [PaymentStatus.PENDING]: "bg-[#FFF7ED] text-[#B45309]",
  [PaymentStatus.FAILED]: "bg-[#FDEEEE] text-[#C0392B]",
  [PaymentStatus.CANCELLED]: "bg-[#F4F5F7] text-[#5B6472]",
  [PaymentStatus.REFUNDED]: "bg-[#EEF0FF] text-[#4A55D0]",
};

const TABLE_GRID = "104px minmax(130px,1fr) 128px 100px 92px 100px 172px";

const headerCellClass =
  "text-[10px] font-extrabold tracking-[0.05em] text-[#A2A7B0]";

const fieldClass =
  "h-9 w-full rounded-[9px] border border-[#E9EAEE] bg-white px-2.5 text-[12px] font-semibold text-[#14161A] outline-none";

function formatDateShort(value?: string | Date) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const timePart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

function StatCard({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#E9EAEE] bg-white px-[14px] py-[13px]">
      <div className="text-[11.5px] font-semibold text-[#8A8F99]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-[19px] font-extrabold text-[#14161A]",
          valueClassName,
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold text-[#A2A7B0]">
        {sub}
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-[5px] text-[11px] font-bold text-[#3D4149]">
        {label}
      </div>
      {children}
    </div>
  );
}

function CompactButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "h-9 shrink-0 rounded-[9px] bg-[#F4F5F7] px-4 text-xs font-bold text-[#3D4149] transition-colors hover:bg-[#E9EAEE] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

function RowActionButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "h-7 shrink-0 rounded-[7px] px-2.5 text-[10.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export default function FinancePage() {
  const {
    payments,
    paymentsMeta,
    isLoading,
    fetchPaymentsByFilters,
    fetchPaymentsByMethod,
    fetchPaymentsByDateRange,
    approvePayment,
    rejectPayment,
    refundPayment,
    getPaymentMethodLabel,
    getPaymentStatusLabel,
    isPending,
    isCompleted,
    isFailed,
  } = usePayment();

  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "ALL">(
    "ALL",
  );
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "ALL">(
    "ALL",
  );
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalAmount: 0,
    completedAmount: 0,
  });

  useEffect(() => {
    const total = payments.length;
    const pending = payments.filter((p) => isPending(p)).length;
    const completed = payments.filter((p) => isCompleted(p)).length;
    const failed = payments.filter((p) => isFailed(p)).length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedAmount = payments
      .filter((p) => isCompleted(p))
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({ total, pending, completed, failed, totalAmount, completedAmount });
  }, [payments, isPending, isCompleted, isFailed]);

  useEffect(() => {
    handleSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // targetPage: por padrão mantém a página atual (ex: reload após aprovar
  // um pagamento não deve chutar o usuário de volta pra página 1).
  const handleSearch = async (targetPage: number = page) => {
    setPage(targetPage);
    const params = { page: targetPage, limit: PAGE_SIZE };

    if (dateFrom && dateTo) {
      await fetchPaymentsByDateRange(
        {
          startDate: new Date(dateFrom).toISOString(),
          endDate: new Date(dateTo).toISOString(),
          customerId: searchCustomerId || undefined,
        },
        params,
      );
    } else if (filterMethod !== "ALL") {
      await fetchPaymentsByMethod(filterMethod, params);
    } else {
      const filters: { orderId?: string; customerId?: string } = {};
      if (searchOrderId) filters.orderId = searchOrderId;
      if (searchCustomerId) filters.customerId = searchCustomerId;
      await fetchPaymentsByFilters(filters, params);
    }
  };

  // Nova busca/filtro sempre volta pra página 1 (ver pagination.md).
  const handleNewSearch = () => handleSearch(1);

  const handleClearFilters = () => {
    setFilterMethod("ALL");
    setFilterStatus("ALL");
    setSearchOrderId("");
    setSearchCustomerId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    fetchPaymentsByFilters({}, { page: 1, limit: PAGE_SIZE });
  };

  const handleApprove = async (payment: Payment) => {
    await approvePayment(payment.id, `TXN-${Date.now()}`);
    handleSearch();
  };

  const handleReject = async (payment: Payment) => {
    await rejectPayment(payment.id);
    handleSearch();
  };

  const handleRefund = async (payment: Payment) => {
    await refundPayment(payment.id);
    handleSearch();
  };

  const filteredPayments =
    filterStatus === "ALL"
      ? payments
      : payments.filter((p) => p.status === filterStatus);

  return (
    <AdminPageLayout
      title="Gestão de Pagamentos"
      icon={DollarSign}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-64 lg:pr-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Cards de estatísticas */}
        <div className="mb-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            label="Total de Pagamentos"
            value={stats.total}
            sub={formatCurrency(stats.totalAmount)}
          />
          <StatCard
            label="Concluídos"
            value={stats.completed}
            sub={formatCurrency(stats.completedAmount)}
            valueClassName="text-[#1B7F4C]"
          />
          <StatCard
            label="Pendentes"
            value={stats.pending}
            sub="Aguardando aprovação"
            valueClassName="text-[#B45309]"
          />
          <StatCard
            label="Falhados"
            value={stats.failed}
            sub="Não processados"
            valueClassName="text-[#C0392B]"
          />
        </div>

        {/* Filtros */}
        <div className="mb-3.5 rounded-[13px] border border-[#E9EAEE] bg-white p-4">
          <div className="mb-3 text-[13px] font-extrabold text-[#14161A]">
            Filtros
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FilterField label="Método de Pagamento">
              <select
                value={filterMethod}
                onChange={(e) =>
                  setFilterMethod(e.target.value as PaymentMethod | "ALL")
                }
                className={fieldClass}
              >
                {PAY_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Status">
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as PaymentStatus | "ALL")
                }
                className={fieldClass}
              >
                {PAY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="ID do Pedido">
              <input
                placeholder="Buscar por pedido"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className={fieldClass}
              />
            </FilterField>

            <FilterField label="ID do Cliente">
              <input
                placeholder="Buscar por cliente"
                value={searchCustomerId}
                onChange={(e) => setSearchCustomerId(e.target.value)}
                className={fieldClass}
              />
            </FilterField>

            <FilterField label="Data Início">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={fieldClass}
              />
            </FilterField>

            <FilterField label="Data Fim">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={fieldClass}
              />
            </FilterField>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleNewSearch}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-[#14161A] px-4 text-xs font-bold text-white transition-colors hover:bg-[#2A2D33]"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
            <CompactButton onClick={handleClearFilters}>
              Limpar filtros
            </CompactButton>
          </div>
        </div>

        {/* Lista de pagamentos */}
        <div className="overflow-hidden rounded-[13px] border border-[#E9EAEE] bg-white">
          <div className="border-b border-[#E9EAEE] p-4 text-[13px] font-extrabold text-[#14161A]">
            Pagamentos encontrados ({filteredPayments.length})
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-[9px]" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-9 text-center">
              <div className="text-2xl">💳</div>
              <div className="mt-1.5 text-[13px] font-bold text-[#14161A]">
                Nenhum pagamento encontrado
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#8A8F99]">
                Tente ajustar os filtros de busca
              </div>
            </div>
          ) : (
            <>
              {/* Mobile: lista em cards */}
              <div className="divide-y divide-[#F4F5F7] md:hidden">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-extrabold text-[#14161A]">
                          #{payment.orderId.slice(0, 8)}
                        </div>
                        <div className="truncate text-[10.5px] font-semibold text-[#A2A7B0]">
                          {payment.transaction || "—"}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "w-fit shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-extrabold",
                          STATUS_BADGE[payment.status],
                        )}
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] font-semibold text-[#5B6472]">
                      <span className="truncate">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </span>
                      <span className="shrink-0 text-[#A2A7B0]">
                        {formatDateShort(payment.date || payment.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[11.5px] font-semibold text-[#8A8F99]"
                        title={payment.customerId}
                      >
                        Cliente {payment.customerId.slice(0, 8)}...
                      </span>
                      <span className="shrink-0 text-[13px] font-extrabold text-[#14161A]">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>

                    {(isPending(payment) ||
                      isFailed(payment) ||
                      isCompleted(payment)) && (
                      <div className="mt-2.5 flex gap-1.5">
                        {isPending(payment) && (
                          <>
                            <RowActionButton
                              onClick={() => handleApprove(payment)}
                              className="flex-1 bg-[#F4F5F7] text-[#3D4149] hover:bg-[#E9EAEE]"
                            >
                              Confirmar
                            </RowActionButton>
                            <RowActionButton
                              onClick={() => handleReject(payment)}
                              className="flex-1 bg-[#FDEEEE] text-[#C0392B] hover:bg-[#FBDEDE]"
                            >
                              Rejeitar
                            </RowActionButton>
                          </>
                        )}
                        {isFailed(payment) && (
                          <RowActionButton
                            onClick={() => handleApprove(payment)}
                            className="flex-1 bg-[#14161A] text-white hover:bg-[#2A2D33]"
                          >
                            Reprocessar
                          </RowActionButton>
                        )}
                        {isCompleted(payment) && (
                          <RowActionButton
                            onClick={() => handleRefund(payment)}
                            className="flex-1 border border-[#E9EAEE] bg-white text-[#3D4149] hover:bg-[#F4F5F7]"
                          >
                            Reembolsar
                          </RowActionButton>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop/tablet: tabela */}
              <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[900px]">
                <div
                  className="grid items-center gap-2.5 border-b border-[#E9EAEE] bg-[#FAFAFB] px-4 py-2.5"
                  style={{ gridTemplateColumns: TABLE_GRID }}
                >
                  <span className={headerCellClass}>PEDIDO / TID</span>
                  <span className={headerCellClass}>CLIENTE</span>
                  <span className={headerCellClass}>MÉTODO</span>
                  <span className={headerCellClass}>DATA</span>
                  <span className={headerCellClass}>STATUS</span>
                  <span className={cn(headerCellClass, "text-right")}>
                    VALOR
                  </span>
                  <span className={cn(headerCellClass, "text-right")}>
                    AÇÃO
                  </span>
                </div>

                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid items-center gap-2.5 border-b border-[#F4F5F7] px-4 py-2.5 last:border-b-0 hover:bg-[#FAFAFB]"
                    style={{ gridTemplateColumns: TABLE_GRID }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-extrabold text-[#14161A]">
                        #{payment.orderId.slice(0, 8)}
                      </div>
                      <div className="truncate text-[10px] font-semibold text-[#A2A7B0]">
                        {payment.transaction || "—"}
                      </div>
                    </div>

                    <span
                      className="truncate text-[12.5px] font-semibold text-[#14161A]"
                      title={payment.customerId}
                    >
                      {payment.customerId.slice(0, 8)}...
                    </span>

                    <span className="truncate text-[11.5px] font-semibold text-[#3D4149]">
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </span>

                    <span className="text-[11px] font-semibold text-[#A2A7B0]">
                      {formatDateShort(payment.date || payment.created_at)}
                    </span>

                    <span
                      className={cn(
                        "w-fit rounded-md px-2 py-0.5 text-[10.5px] font-extrabold",
                        STATUS_BADGE[payment.status],
                      )}
                    >
                      {getPaymentStatusLabel(payment.status)}
                    </span>

                    <span className="text-right text-[13px] font-extrabold text-[#14161A]">
                      {formatCurrency(payment.amount)}
                    </span>

                    <div className="flex justify-end gap-1.5">
                      {isPending(payment) && (
                        <>
                          <RowActionButton
                            onClick={() => handleApprove(payment)}
                            className="bg-[#F4F5F7] text-[#3D4149] hover:bg-[#E9EAEE]"
                          >
                            Confirmar
                          </RowActionButton>
                          <RowActionButton
                            onClick={() => handleReject(payment)}
                            className="bg-[#FDEEEE] text-[#C0392B] hover:bg-[#FBDEDE]"
                          >
                            Rejeitar
                          </RowActionButton>
                        </>
                      )}
                      {isFailed(payment) && (
                        <RowActionButton
                          onClick={() => handleApprove(payment)}
                          className="bg-[#14161A] text-white hover:bg-[#2A2D33]"
                        >
                          Reprocessar
                        </RowActionButton>
                      )}
                      {isCompleted(payment) && (
                        <RowActionButton
                          onClick={() => handleRefund(payment)}
                          className="border border-[#E9EAEE] bg-white text-[#3D4149] hover:bg-[#F4F5F7]"
                        >
                          Reembolsar
                        </RowActionButton>
                      )}
                      {!isPending(payment) &&
                        !isFailed(payment) &&
                        !isCompleted(payment) && (
                          <span className="text-[11px] text-[#A2A7B0]">
                            —
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </>
          )}

          {paymentsMeta && paymentsMeta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-[#E9EAEE] px-4 py-3">
              <span className="text-[11.5px] font-semibold text-[#8A8F99]">
                Página {paymentsMeta.page} de {paymentsMeta.totalPages} (
                {paymentsMeta.total} pagamentos)
              </span>
              <div className="flex gap-1.5">
                <CompactButton
                  onClick={() => handleSearch(page - 1)}
                  disabled={page <= 1 || isLoading}
                >
                  Anterior
                </CompactButton>
                <CompactButton
                  onClick={() => handleSearch(page + 1)}
                  disabled={page >= paymentsMeta.totalPages || isLoading}
                >
                  Próxima
                </CompactButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
