"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCashDeposit,
  useCashMovementSummary,
  useCashRefund,
  useCashRegister,
  useCashSale,
  useCashWithdrawal,
  useCloseCashRegister,
  useOpenCashRegister,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { PaymentMethod } from "@/services/api";
import { useAuthStore, useFinancialPreferencesStore } from "@/stores";
import { formatCurrency } from "@/utils";
import { Banknote, RefreshCw } from "lucide-react";
import { type ReactNode, useState } from "react";

type MovementType = "withdrawal" | "deposit" | "sale" | "refund";
type DialogKind = "open-register" | "movement" | null;

const MOVEMENT_OPTIONS: { value: MovementType; label: string }[] = [
  { value: "withdrawal", label: "Sangria" },
  { value: "deposit", label: "Suprimento" },
  { value: "sale", label: "Venda" },
  { value: "refund", label: "Reembolso" },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Dinheiro",
  [PaymentMethod.CREDIT_CARD]: "Cartão de Crédito",
  [PaymentMethod.DEBIT_CARD]: "Cartão de Débito",
  [PaymentMethod.PIX]: "PIX",
  [PaymentMethod.BANK_TRANSFER]: "Transferência Bancária",
};

const fieldClass =
  "h-9 w-full rounded-[9px] border border-[#E9EAEE] bg-[#FAFAFB] px-2.5 text-[12.5px] font-semibold text-[#14161A] outline-none";

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
      <div className="whitespace-nowrap text-[11.5px] font-semibold text-[#8A8F99]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 whitespace-nowrap text-[19px] font-extrabold text-[#14161A]",
          valueClassName,
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-[#A2A7B0]">
        {sub}
      </div>
    </div>
  );
}

function CompactButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      className={cn(
        "h-9 shrink-0 rounded-[9px] bg-[#F4F5F7] px-4 text-xs font-bold text-[#3D4149] transition-colors hover:bg-[#E9EAEE] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

function ModalTitle({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <DialogTitle className="text-[16px] font-extrabold tracking-tight text-[#14161A]">
        {children}
      </DialogTitle>
      <Button
        onClick={onClose}
        className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#F4F5F7] text-xs text-[#3D4149]"
      >
        ✕
      </Button>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[6px] text-[11.5px] font-bold text-[#3D4149]">
      {children}
    </div>
  );
}

export default function CashRegisterPage() {
  const { user } = useAuthStore();
  const { defaultPaymentMethod, confirmBeforeCloseRegister } =
    useFinancialPreferencesStore();
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

  const openMutation = useOpenCashRegister();
  const closeMutation = useCloseCashRegister();
  const withdrawalMutation = useCashWithdrawal();
  const depositMutation = useCashDeposit();
  const saleMutation = useCashSale();
  const refundMutation = useCashRefund();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [movementType, setMovementType] = useState<MovementType>("withdrawal");

  const [openingBalance, setOpeningBalance] = useState("");
  const [openObs, setOpenObs] = useState("");
  const [countedTotal, setCountedTotal] = useState("");
  const [closeObs, setCloseObs] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(defaultPaymentMethod);
  const [description, setDescription] = useState("");
  const [closeConfirmed, setCloseConfirmed] = useState(false);

  const isRegisterOpen = !!register;

  const resetMovementForm = () => {
    setAmount("");
    setDescription("");
    setPaymentMethod(defaultPaymentMethod);
  };

  const closeDialog = () => {
    setDialog(null);
    setOpeningBalance("");
    setOpenObs("");
    resetMovementForm();
  };

  const handleRefresh = () => {
    refetchRegister();
    refetchSummary();
  };

  const handleOpenRegister = async () => {
    const balance = parseFloat(openingBalance.replace(",", "."));
    if (isNaN(balance) || balance < 0) return;
    await openMutation.mutateAsync({
      openingBalance: balance,
      observations: openObs || undefined,
    });
    closeDialog();
  };

  const handleCloseRegister = async () => {
    const counted = parseFloat(countedTotal.replace(",", "."));
    if (isNaN(counted) || counted < 0) return;
    if (confirmBeforeCloseRegister && !closeConfirmed) return;
    await closeMutation.mutateAsync({
      countedTotal: counted,
      observations: closeObs || undefined,
    });
    setCountedTotal("");
    setCloseObs("");
    setCloseConfirmed(false);
  };

  const openMovementDialog = (type: MovementType) => {
    setMovementType(type);
    resetMovementForm();
    setDialog("movement");
  };

  const handleConfirmMovement = async () => {
    const value = parseFloat(amount.replace(",", "."));
    if (isNaN(value) || value <= 0 || !description.trim()) return;

    if (movementType === "withdrawal") {
      await withdrawalMutation.mutateAsync({ amount: value, description });
    } else if (movementType === "deposit") {
      await depositMutation.mutateAsync({ amount: value, description });
    } else if (movementType === "sale") {
      await saleMutation.mutateAsync({
        amount: value,
        paymentMethod,
        description,
      });
    } else {
      await refundMutation.mutateAsync({ amount: value, description });
    }

    closeDialog();
  };

  const isMovementPending =
    withdrawalMutation.isPending ||
    depositMutation.isPending ||
    saleMutation.isPending ||
    refundMutation.isPending;

  const availableBalance = summary?.availableBalance ?? 0;
  const hasContado = countedTotal.trim() !== "";
  const contadoVal = parseFloat(countedTotal.replace(",", "."));
  const difVal =
    hasContado && !isNaN(contadoVal) ? contadoVal - availableBalance : 0;
  const difOk = hasContado && !isNaN(contadoVal) && Math.abs(difVal) < 0.005;
  const difSobra = hasContado && !isNaN(contadoVal) && difVal >= 0.005;
  const difFalta = hasContado && !isNaN(contadoVal) && difVal <= -0.005;

  const paymentBreakdown = summary
    ? [
        {
          label: "Dinheiro",
          value: summary.totalCash,
          gaveta: true,
        },
        { label: "PIX", value: summary.totalPix, gaveta: false },
        {
          label: "Cartão de Crédito",
          value: summary.totalCredit,
          gaveta: false,
        },
        {
          label: "Cartão de Débito",
          value: summary.totalDebit,
          gaveta: false,
        },
        {
          label: "Transferência",
          value: summary.totalTransfer,
          gaveta: false,
        },
      ]
    : [];
  const paymentTotal = paymentBreakdown.reduce((sum, m) => sum + m.value, 0);

  return (
    <AdminPageLayout
      title="Controle de Caixa"
      icon={Banknote}
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
      <div className="mx-auto max-w-7xl">
        <p className="mb-3.5 text-[12.5px] font-medium text-[#8A8F99]">
          Abertura, fechamento e movimentos financeiros
        </p>

        {registerLoading ? (
          <Skeleton className="h-24 w-full rounded-[13px]" />
        ) : isRegisterOpen && register ? (
          <>
            {/* Banner de caixa aberto */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[13px] bg-[#14161A] px-[18px] py-[14px]">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-white/10 text-white">
                  <Banknote className="h-[19px] w-[19px]" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-extrabold tracking-tight text-white">
                      Caixa aberto
                    </span>
                    <span className="shrink-0 rounded-md bg-[#1F7A4D] px-2 py-0.5 text-[10px] font-extrabold text-white">
                      ABERTO
                    </span>
                  </div>
                  <div className="mt-[3px] flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] font-semibold text-[#9BA1AC]">
                    <span className="whitespace-nowrap">
                      Operador: {user?.name || "—"}
                    </span>
                    <span className="whitespace-nowrap">
                      Aberto às {formatTime(register.openedAt)}
                    </span>
                    <span className="whitespace-nowrap">
                      Fundo de troco {formatCurrency(register.openingBalance)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-[7px]">
                <Button
                  onClick={() => openMovementDialog("deposit")}
                  className="h-[34px] rounded-[9px] bg-white/[.12] px-3.5 text-xs font-bold text-white hover:bg-white/20"
                >
                  + Entrada
                </Button>
                <Button
                  onClick={() => openMovementDialog("withdrawal")}
                  className="h-[34px] rounded-[9px] bg-white/[.12] px-3.5 text-xs font-bold text-white hover:bg-white/20"
                >
                  − Saída
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-3 lg:[grid-template-columns:repeat(auto-fit,minmax(440px,1fr))]">
              {/* Coluna principal */}
              <div className="flex min-w-0 flex-col gap-3">
                <div className="grid grid-cols-1 gap-2.5 sm:[grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                  {summaryLoading ? (
                    <>
                      <Skeleton className="h-[74px] rounded-[12px]" />
                      <Skeleton className="h-[74px] rounded-[12px]" />
                      <Skeleton className="h-[74px] rounded-[12px]" />
                    </>
                  ) : (
                    <>
                      <StatCard
                        label="Vendas do turno"
                        value={formatCurrency(summary?.totalSales ?? 0)}
                        sub="Total registrado"
                      />
                      <StatCard
                        label="Entradas"
                        value={formatCurrency(summary?.totalDeposits ?? 0)}
                        sub="Dinheiro adicionado"
                        valueClassName="text-[#1B7F4C]"
                      />
                      <StatCard
                        label="Saídas"
                        value={formatCurrency(summary?.totalWithdrawals ?? 0)}
                        sub="Dinheiro retirado"
                        valueClassName="text-[#C0392B]"
                      />
                    </>
                  )}
                </div>

                {/* Formas de pagamento */}
                <div className="rounded-[13px] border border-[#E9EAEE] bg-white px-4 py-3.5">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-[13px] font-extrabold text-[#14161A]">
                      Formas de pagamento
                    </span>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-[#A2A7B0]">
                      Só dinheiro entra na gaveta
                    </span>
                  </div>
                  {summaryLoading ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton
                          key={i}
                          className="h-[30px] w-full rounded-[8px]"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[11px]">
                      {paymentBreakdown.map((m) => {
                        const pct =
                          paymentTotal > 0
                            ? Math.round((m.value / paymentTotal) * 100)
                            : 0;
                        return (
                          <div key={m.label}>
                            <div className="flex items-center gap-2">
                              <span className="min-w-[80px] flex-1 truncate text-[12.5px] font-bold text-[#14161A]">
                                {m.label}
                              </span>
                              {m.gaveta && (
                                <span className="shrink-0 rounded-[5px] bg-[#FFF1E7] px-[7px] py-px text-[9.5px] font-extrabold text-[#E05A00]">
                                  GAVETA
                                </span>
                              )}
                              <span className="w-[78px] shrink-0 text-right text-[12.5px] font-extrabold text-[#14161A]">
                                {formatCurrency(m.value)}
                              </span>
                              <span className="w-[34px] shrink-0 text-right text-[11px] font-bold text-[#8A8F99]">
                                {pct}%
                              </span>
                            </div>
                            <div className="mt-[5px] h-[5px] overflow-hidden rounded-full bg-[#F0F1F4]">
                              <div
                                className="h-full rounded-full bg-[#FF6B00]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ações rápidas */}
                <div className="overflow-hidden rounded-[13px] border border-[#E9EAEE] bg-white">
                  <div className="border-b border-[#E9EAEE] px-4 py-3 text-[13px] font-extrabold text-[#14161A]">
                    Registrar movimento
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3.5 sm:grid-cols-4">
                    {MOVEMENT_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        onClick={() => openMovementDialog(opt.value)}
                        className="rounded-[10px] border border-[#E9EAEE] bg-white px-2 py-2.5 text-center text-[12px] font-bold text-[#3D4149] transition-colors hover:bg-[#F4F5F7]"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conferência de fechamento */}
              <div className="min-w-0 rounded-[13px] border border-[#E9EAEE] bg-white p-[14px] lg:sticky lg:top-[26px]">
                <div className="text-[13px] font-extrabold text-[#14161A]">
                  Conferência de fechamento
                </div>
                <p className="mt-[3px] text-[11px] font-semibold text-[#A2A7B0]">
                  Confira o dinheiro físico da gaveta
                </p>

                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#8A8F99]">
                      Fundo de troco
                    </span>
                    <span className="font-bold">
                      {formatCurrency(register.openingBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#8A8F99]">
                      Vendas em dinheiro
                    </span>
                    <span className="font-bold text-[#1B7F4C]">
                      + {formatCurrency(summary?.totalCash ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#8A8F99]">
                      Entradas
                    </span>
                    <span className="font-bold text-[#1B7F4C]">
                      + {formatCurrency(summary?.totalDeposits ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#8A8F99]">Saídas</span>
                    <span className="font-bold text-[#C0392B]">
                      − {formatCurrency(summary?.totalWithdrawals ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="my-3 h-px bg-[#E9EAEE]" />

                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-extrabold">
                    Esperado na gaveta
                  </span>
                  <span className="text-[18px] font-extrabold tracking-tight">
                    {formatCurrency(availableBalance)}
                  </span>
                </div>

                <div className="mb-[6px] mt-3 text-[11px] font-bold text-[#3D4149]">
                  Valor contado
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-[11.5px] font-bold text-[#A0A6B0]">
                    R$
                  </span>
                  <input
                    placeholder="0,00"
                    value={countedTotal}
                    onChange={(e) => setCountedTotal(e.target.value)}
                    className="h-[38px] w-full rounded-[9px] border border-[#E9EAEE] bg-white pl-[34px] pr-3 text-[13px] font-bold text-[#14161A] outline-none"
                  />
                </div>

                {!hasContado && (
                  <div className="mt-[9px] rounded-[9px] bg-[#F7F8FA] px-[11px] py-[9px] text-[11.5px] font-semibold text-[#8A8F99]">
                    Informe o valor contado para calcular a diferença.
                  </div>
                )}
                {difOk && (
                  <div className="mt-[9px] rounded-[9px] bg-[#E9F7EF] px-[11px] py-[9px] text-xs font-extrabold text-[#1B7F4C]">
                    ✓ Caixa conferido, sem diferença
                  </div>
                )}
                {difSobra && (
                  <div className="mt-[9px] rounded-[9px] bg-[#EEF0FF] px-[11px] py-[9px] text-xs font-extrabold text-[#4A55D0]">
                    Sobra de {formatCurrency(Math.abs(difVal))}
                  </div>
                )}
                {difFalta && (
                  <div className="mt-[9px] rounded-[9px] bg-[#FDEEEE] px-[11px] py-[9px] text-xs font-extrabold text-[#C0392B]">
                    Falta de {formatCurrency(Math.abs(difVal))}
                  </div>
                )}

                <input
                  placeholder="Observações (opcional)"
                  value={closeObs}
                  onChange={(e) => setCloseObs(e.target.value)}
                  className={cn(fieldClass, "mt-2.5 bg-white")}
                />

                {confirmBeforeCloseRegister && (
                  <label className="mt-2.5 flex cursor-pointer items-start gap-2">
                    <Checkbox
                      checked={closeConfirmed}
                      onCheckedChange={(checked) =>
                        setCloseConfirmed(checked === true)
                      }
                      className="mt-0.5 h-4 w-4"
                    />
                    <span className="text-[11.5px] font-semibold text-[#3D4149]">
                      Confirmo que conferi o dinheiro físico da gaveta
                    </span>
                  </label>
                )}

                <Button
                  onClick={handleCloseRegister}
                  disabled={
                    closeMutation.isPending ||
                    (confirmBeforeCloseRegister && !closeConfirmed)
                  }
                  className="mt-3 h-10 w-full rounded-[10px] bg-[#14161A] text-[13px] font-extrabold text-white transition-colors hover:bg-[#2A2D33] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {closeMutation.isPending ? "Fechando..." : "Fechar caixa"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Banner de caixa fechado */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#F4F5F7] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[15px]">🔒</span>
                <span className="text-[13.5px] font-extrabold text-[#3D4149]">
                  Caixa Fechado
                </span>
              </div>
              <Button
                onClick={() => setDialog("open-register")}
                className="h-[34px] rounded-[9px] bg-[#FF6B00] px-4 text-[12.5px] font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,.25)] hover:bg-[#E86000]"
              >
                🔓 Abrir Caixa
              </Button>
            </div>
            <div className="rounded-[13px] border border-dashed border-[#DDDFE4] bg-white px-5 py-10 text-center">
              <div className="text-[26px]">💵</div>
              <div className="mt-2 text-[13.5px] font-bold text-[#14161A]">
                Nenhum caixa aberto
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#8A8F99]">
                Abra o caixa para registrar movimentos
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Abrir caixa */}
      <Dialog
        open={dialog === "open-register"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent
          hideClose
          className="max-w-[340px] gap-0 rounded-[15px] border-none p-[18px] shadow-2xl"
        >
          <ModalTitle onClose={closeDialog}>Abrir caixa</ModalTitle>

          <FieldLabel>Fundo de troco inicial</FieldLabel>
          <div className="relative mb-3">
            <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-[11.5px] font-bold text-[#A0A6B0]">
              R$
            </span>
            <input
              placeholder="0,00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="h-[38px] w-full rounded-[9px] border border-[#E9EAEE] bg-[#FAFAFB] pl-[34px] pr-3 text-[13px] text-[#14161A] outline-none"
            />
          </div>

          <FieldLabel>Observações (opcional)</FieldLabel>
          <input
            placeholder="Ex: Abertura turno manhã"
            value={openObs}
            onChange={(e) => setOpenObs(e.target.value)}
            className={cn(fieldClass, "mb-4 h-[38px]")}
          />

          <div className="flex gap-2">
            <CompactButton onClick={closeDialog} className="flex-1">
              Cancelar
            </CompactButton>
            <Button
              onClick={handleOpenRegister}
              disabled={openMutation.isPending || !openingBalance}
              className="h-9 flex-1 rounded-[9px] bg-[#FF6B00] text-xs font-extrabold text-white transition-colors hover:bg-[#E86000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {openMutation.isPending ? "Abrindo..." : "Abrir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar movimento */}
      <Dialog
        open={dialog === "movement"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent
          hideClose
          className="max-w-[380px] gap-0 rounded-[15px] border-none p-[18px] shadow-2xl"
        >
          <ModalTitle onClose={closeDialog}>Registrar movimento</ModalTitle>

          <FieldLabel>Tipo</FieldLabel>
          <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {MOVEMENT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                onClick={() => setMovementType(opt.value)}
                className={cn(
                  "h-[30px] rounded-[8px] text-[11px] font-bold transition-colors",
                  movementType === opt.value
                    ? "bg-[#14161A] text-white"
                    : "bg-[#F4F5F7] text-[#3D4149] hover:bg-[#E9EAEE]",
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {movementType === "sale" && (
            <>
              <FieldLabel>Método de pagamento</FieldLabel>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className={cn(fieldClass, "mb-3 h-[38px] bg-[#FAFAFB]")}
              >
                {Object.values(PaymentMethod).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </>
          )}

          <FieldLabel>Descrição</FieldLabel>
          <input
            placeholder="Ex: Sangria, reforço…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-3 h-[38px] w-full rounded-[9px] border border-[#E9EAEE] bg-[#FAFAFB] px-3 text-[13px] text-[#14161A] outline-none"
          />

          <FieldLabel>Valor</FieldLabel>
          <div className="relative mb-4">
            <span className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-[11.5px] font-bold text-[#A0A6B0]">
              R$
            </span>
            <input
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-[38px] w-full rounded-[9px] border border-[#E9EAEE] bg-[#FAFAFB] pl-[34px] pr-3 text-[13px] text-[#14161A] outline-none"
            />
          </div>

          <div className="flex gap-2">
            <CompactButton onClick={closeDialog} className="flex-1">
              Cancelar
            </CompactButton>
            <Button
              onClick={handleConfirmMovement}
              disabled={isMovementPending || !amount || !description}
              className="h-9 flex-1 rounded-[9px] bg-[#FF6B00] text-xs font-extrabold text-white transition-colors hover:bg-[#E86000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMovementPending ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
