"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@/utils";

import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CreditCard,
  Shield,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

type Props = {
  setPaymentMethod: Dispatch<SetStateAction<string>>;
  setNeedsChange: Dispatch<SetStateAction<boolean>>;
  setChangeAmount: Dispatch<SetStateAction<string>>;
  total: number;
  paymentMethod: string;
  changeAmount: string;
  needsChange: boolean;
};

type PaymentMoment = "now" | "delivery";

type PaymentOption = {
  value: string;
  label: string;
  description: string;
  icon: typeof Smartphone;
};

const momentOptions = [
  {
    value: "now" as const,
    label: "Pagar agora",
    description: "Online, na confirmacao",
  },
  {
    value: "delivery" as const,
    label: "Pagar na entrega",
    description: "Ao receber o pedido",
  },
];

const nowOptions: PaymentOption[] = [
  {
    value: "pix",
    label: "Pix",
    description: "Instantaneo",
    icon: Smartphone,
  },
  {
    value: "credit",
    label: "Cartao de credito",
    description: "Online seguro",
    icon: CreditCard,
  },
  {
    value: "debit",
    label: "Cartao de debito",
    description: "Online seguro",
    icon: CreditCard,
  },
  {
    value: "bank_transfer",
    label: "Transferencia",
    description: "Bancaria",
    icon: Building2,
  },
];

const deliveryOptions: PaymentOption[] = [
  {
    value: "cash",
    label: "Dinheiro",
    description: "Com troco se precisar",
    icon: Banknote,
  },
  {
    value: "card_machine",
    label: "Cartao na maquininha",
    description: "Credito ou debito",
    icon: CreditCard,
  },
  {
    value: "pix_on_delivery",
    label: "Pix na entrega",
    description: "Direto ao entregador",
    icon: Smartphone,
  },
];

export function PaymentMethod({
  setPaymentMethod,
  setNeedsChange,
  setChangeAmount,
  total,
  paymentMethod,
  changeAmount,
  needsChange,
}: Props) {
  const [paymentMoment, setPaymentMoment] = useState<PaymentMoment>(
    paymentMethod === "cash" ||
      paymentMethod === "card_machine" ||
      paymentMethod === "pix_on_delivery"
      ? "delivery"
      : "now",
  );

  useEffect(() => {
    if (
      paymentMethod === "cash" ||
      paymentMethod === "card_machine" ||
      paymentMethod === "pix_on_delivery"
    ) {
      setPaymentMoment("delivery");
    }
  }, [paymentMethod]);

  const currentOptions = useMemo(
    () => (paymentMoment === "now" ? nowOptions : deliveryOptions),
    [paymentMoment],
  );

  const normalizedChangeAmount = Number.parseFloat(
    changeAmount.replace(",", "."),
  );
  const hasChangeAmount = changeAmount.trim().length > 0;
  const isChangeInvalid =
    hasChangeAmount &&
    (Number.isNaN(normalizedChangeAmount) || normalizedChangeAmount <= total);

  const handleMomentSelect = (moment: PaymentMoment) => {
    setPaymentMoment(moment);
    setNeedsChange(false);
    setChangeAmount("");
    setPaymentMethod(moment === "now" ? "pix" : "cash");
  };

  const handleMethodSelect = (method: string) => {
    setPaymentMethod(method);

    if (method !== "cash") {
      setNeedsChange(false);
      setChangeAmount("");
    }
  };

  const paymentNote =
    paymentMoment === "delivery"
      ? "Voce paga direto ao entregador no recebimento do pedido."
      : "Pagamento processado com criptografia. Nao armazenamos dados do cartao.";

  return (
    <section className="rounded-lg border border-[#E9EAEE] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <CreditCard className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-extrabold text-gray-950">
          Forma de pagamento
        </h2>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {momentOptions.map((moment) => {
          const isActive = paymentMoment === moment.value;

          return (
            <button
              key={moment.value}
              type="button"
              onClick={() => handleMomentSelect(moment.value)}
              className={cn(
                "flex min-h-[52px] flex-col justify-center rounded-lg border px-3 text-left transition-colors",
                isActive
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-[#E9EAEE] bg-white text-gray-900 hover:border-orange-300",
              )}
            >
              <span className="text-sm font-extrabold">{moment.label}</span>
              <span className="mt-0.5 text-xs font-semibold opacity-75">
                {moment.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {currentOptions.map((option) => {
          const Icon = option.icon;
          const isActive = paymentMethod === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleMethodSelect(option.value)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-colors",
                isActive
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-[#E9EAEE] bg-white text-gray-700 hover:border-orange-300 hover:text-orange-700",
              )}
              title={option.description}
            >
              <Icon className="h-4 w-4" />
              {option.label}
              {isActive && <Check className="h-3.5 w-3.5" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#E9EAEE] bg-[#FAFAFB] p-3 text-xs font-semibold text-gray-600">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p>{paymentNote}</p>
      </div>

      {(paymentMethod === "credit" || paymentMethod === "debit") &&
        paymentMoment === "now" && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Pagamento online com cartao
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-700">
                  Depois de confirmar o pedido, voce segue para a etapa segura
                  de pagamento.
                </p>
              </div>
            </div>
          </div>
        )}

      {paymentMethod === "pix" && paymentMoment === "now" && (
        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex items-start gap-2">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Pagamento via Pix
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                O codigo Pix fica disponivel apos a confirmacao do pedido.
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "bank_transfer" && (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div>
              <p className="text-sm font-bold text-indigo-900">
                Transferencia bancaria
              </p>
              <p className="mt-1 text-xs font-semibold text-indigo-700">
                Envie o comprovante para confirmacao do pagamento.
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentMoment === "delivery" && paymentMethod !== "cash" && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Pagamento no recebimento
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Combine o pagamento com o entregador no momento da entrega.
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "cash" && (
        <div className="mt-3 rounded-lg border border-[#E9EAEE] bg-[#FAFAFB] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-gray-950">
              Precisa de troco?
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={needsChange ? "default" : "outline"}
                onClick={() => setNeedsChange(true)}
                className={cn(
                  "h-8 rounded-full px-4 text-xs font-bold",
                  needsChange
                    ? "bg-gray-950 text-white hover:bg-gray-800"
                    : "border-[#E9EAEE] bg-white text-gray-700",
                )}
              >
                Sim
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!needsChange ? "default" : "outline"}
                onClick={() => {
                  setNeedsChange(false);
                  setChangeAmount("");
                }}
                className={cn(
                  "h-8 rounded-full px-4 text-xs font-bold",
                  !needsChange
                    ? "bg-gray-950 text-white hover:bg-gray-800"
                    : "border-[#E9EAEE] bg-white text-gray-700",
                )}
              >
                Nao
              </Button>
            </div>
          </div>

          {needsChange && (
            <div className="mt-3 max-w-[220px] space-y-1.5">
              <Label
                htmlFor="changeAmount"
                className="text-[11px] font-bold text-gray-700"
              >
                Troco para quanto?
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  R$
                </span>
                <Input
                  id="changeAmount"
                  inputMode="decimal"
                  placeholder="100,00"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  className="h-9 rounded-lg border-[#E9EAEE] bg-white pl-9 text-sm shadow-none focus-visible:border-orange-400 focus-visible:ring-orange-200"
                />
              </div>

              {isChangeInvalid && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  Valor menor que o total ({formatCurrency(total)}).
                </p>
              )}

              {hasChangeAmount && !isChangeInvalid && (
                <p className="text-xs font-semibold text-emerald-700">
                  Troco:{" "}
                  {formatCurrency(Number(normalizedChangeAmount) - total)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
