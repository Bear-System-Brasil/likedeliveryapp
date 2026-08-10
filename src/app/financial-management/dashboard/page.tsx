"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PaymentMethod } from "@/services/api";
import { formatCurrency } from "@/utils";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  ShoppingCart,
  Unlock,
} from "lucide-react";
import { useState } from "react";

type MovementDialog =
  | "open-register"
  | "close-register"
  | "withdrawal"
  | "deposit"
  | "sale"
  | "refund"
  | null;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Dinheiro",
  [PaymentMethod.CREDIT_CARD]: "Cartão de Crédito",
  [PaymentMethod.DEBIT_CARD]: "Cartão de Débito",
  [PaymentMethod.PIX]: "PIX",
  [PaymentMethod.BANK_TRANSFER]: "Transferência Bancária",
};

export default function CashRegisterPage() {
  const { data: register, isLoading: registerLoading } = useCashRegister();
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

  const [dialog, setDialog] = useState<MovementDialog>(null);

  // Form state
  const [openingBalance, setOpeningBalance] = useState("");
  const [openObs, setOpenObs] = useState("");
  const [countedTotal, setCountedTotal] = useState("");
  const [closeObs, setCloseObs] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [description, setDescription] = useState("");

  const isRegisterOpen = !!register;

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setPaymentMethod(PaymentMethod.CASH);
    setOpeningBalance("");
    setOpenObs("");
    setCountedTotal("");
    setCloseObs("");
  };

  const closeDialog = () => {
    setDialog(null);
    resetForm();
  };

  const handleOpenRegister = async () => {
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) return;
    await openMutation.mutateAsync({
      openingBalance: balance,
      observations: openObs || undefined,
    });
    closeDialog();
  };

  const handleCloseRegister = async () => {
    const counted = parseFloat(countedTotal);
    if (isNaN(counted) || counted < 0) return;
    await closeMutation.mutateAsync({
      countedTotal: counted,
      observations: closeObs || undefined,
    });
    closeDialog();
  };

  const handleMovement = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0 || !description.trim()) return;

    const payload = { amount: value, paymentMethod, description };

    if (dialog === "withdrawal") await withdrawalMutation.mutateAsync(payload);
    else if (dialog === "deposit") await depositMutation.mutateAsync(payload);
    else if (dialog === "sale") await saleMutation.mutateAsync(payload);
    else if (dialog === "refund") await refundMutation.mutateAsync(payload);

    closeDialog();
  };

  const isMovementPending =
    withdrawalMutation.isPending ||
    depositMutation.isPending ||
    saleMutation.isPending ||
    refundMutation.isPending;

  return (
    <AdminPageLayout
      title="Controle de Caixa"
      icon={Banknote}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-64 lg:pr-8"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchSummary()}
          className="rounded-xl gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <p className="text-sm text-gray-500">
          Abertura, fechamento e movimentos financeiros
        </p>

          {/* Status do Caixa */}
          {registerLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <div
              className={`rounded-xl p-5 border flex items-center justify-between ${
                isRegisterOpen
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {isRegisterOpen ? (
                  <Unlock className="h-7 w-7 text-green-600" />
                ) : (
                  <Lock className="h-7 w-7 text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {isRegisterOpen ? "Caixa Aberto" : "Caixa Fechado"}
                  </p>
                  {isRegisterOpen && register && (
                    <p className="text-sm text-gray-600">
                      Aberto em{" "}
                      {new Date(register.openedAt).toLocaleString("pt-BR")} •
                      Saldo inicial: {formatCurrency(register.openingBalance)}
                    </p>
                  )}
                </div>
              </div>

              {isRegisterOpen ? (
                <Button
                  variant="outline"
                  onClick={() => setDialog("close-register")}
                  className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              ) : (
                <Button
                  onClick={() => setDialog("open-register")}
                  className="rounded-xl bg-linear-to-r from-orange-500 to-pink-500 text-white"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              )}
            </div>
          )}

          {/* Resumo do Caixa */}
          {isRegisterOpen && (
            <>
              {summaryLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : summary ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                      label="Saldo Disponível"
                      value={formatCurrency(summary.availableBalance)}
                      color="text-green-700"
                      bg="bg-green-50 border-green-200"
                    />
                    <SummaryCard
                      label="Total em Vendas"
                      value={formatCurrency(summary.totalSales)}
                      color="text-blue-700"
                      bg="bg-blue-50 border-blue-200"
                    />
                    <SummaryCard
                      label="Total Sangrias"
                      value={formatCurrency(summary.totalWithdrawals)}
                      color="text-red-700"
                      bg="bg-red-50 border-red-200"
                    />
                    <SummaryCard
                      label="Total Suprimentos"
                      value={formatCurrency(summary.totalDeposits)}
                      color="text-purple-700"
                      bg="bg-purple-50 border-purple-200"
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold mb-4">
                      Por método de pagamento
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <MethodBadge label="Dinheiro" value={summary.totalCash} />
                      <MethodBadge
                        label="Crédito"
                        value={summary.totalCredit}
                      />
                      <MethodBadge label="Débito" value={summary.totalDebit} />
                      <MethodBadge label="PIX" value={summary.totalPix} />
                      <MethodBadge
                        label="Transferência"
                        value={summary.totalTransfer}
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {/* Ações de movimento */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold mb-4">Registrar Movimento</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ActionButton
                    icon={<Minus className="h-5 w-5 text-red-500" />}
                    label="Sangria"
                    description="Retirada de valor"
                    onClick={() => setDialog("withdrawal")}
                  />
                  <ActionButton
                    icon={<Plus className="h-5 w-5 text-purple-500" />}
                    label="Suprimento"
                    description="Entrada de troco"
                    onClick={() => setDialog("deposit")}
                  />
                  <ActionButton
                    icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
                    label="Venda Manual"
                    description="Registrar venda"
                    onClick={() => setDialog("sale")}
                  />
                  <ActionButton
                    icon={<ArrowUpRight className="h-5 w-5 text-orange-500" />}
                    label="Reembolso"
                    description="Devolução manual"
                    onClick={() => setDialog("refund")}
                  />
                </div>
              </div>
            </>
          )}

          {!isRegisterOpen && !registerLoading && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <Banknote className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum caixa aberto</p>
              <p className="text-sm text-gray-400 mt-1">
                Abra o caixa para registrar movimentos
              </p>
            </div>
          )}
      </div>

      {/* Dialog Abrir Caixa */}
      <Dialog open={dialog === "open-register"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Saldo de Abertura (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Input
                placeholder="Ex: Abertura turno manhã"
                value={openObs}
                onChange={(e) => setOpenObs(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOpenRegister}
              disabled={openMutation.isPending || !openingBalance}
              className="rounded-xl bg-linear-to-r from-orange-500 to-pink-500 text-white"
            >
              {openMutation.isPending ? "Abrindo..." : "Confirmar Abertura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fechar Caixa */}
      <Dialog open={dialog === "close-register"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Saldo disponível:{" "}
                <strong>{formatCurrency(summary.availableBalance)}</strong>
              </span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label>Total Contado (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={countedTotal}
                onChange={(e) => setCountedTotal(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Input
                placeholder="Ex: Fechamento sem divergência"
                value={closeObs}
                onChange={(e) => setCloseObs(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCloseRegister}
              disabled={closeMutation.isPending || !countedTotal}
              className="rounded-xl border-red-300 text-red-600 bg-white hover:bg-red-50"
              variant="outline"
            >
              {closeMutation.isPending ? "Fechando..." : "Confirmar Fechamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Movimentos (Sangria / Suprimento / Venda / Reembolso) */}
      <Dialog
        open={["withdrawal", "deposit", "sale", "refund"].includes(
          dialog ?? "",
        )}
        onOpenChange={closeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "withdrawal" && "Registrar Sangria"}
              {dialog === "deposit" && "Registrar Suprimento"}
              {dialog === "sale" && "Registrar Venda Manual"}
              {dialog === "refund" && "Registrar Reembolso"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>Método de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentMethod).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Motivo ou observação"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMovement}
              disabled={isMovementPending || !amount || !description}
              className="rounded-xl bg-linear-to-r from-orange-500 to-pink-500 text-white"
            >
              {isMovementPending ? "Registrando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}

function SummaryCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${bg}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MethodBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-lg p-3 border border-gray-100">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="font-semibold text-sm">{formatCurrency(value)}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-center cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-gray-400">{description}</span>
    </button>
  );
}
