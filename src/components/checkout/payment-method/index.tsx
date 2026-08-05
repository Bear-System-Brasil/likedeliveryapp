"use client";

import { Dispatch, SetStateAction } from "react";

import { formatCurrency } from "@/utils";

import {
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Shield,
  AlertCircle,
} from "lucide-react";

import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  setPaymentMethod: Dispatch<SetStateAction<string>>;
  setNeedsChange: Dispatch<SetStateAction<boolean>>;
  setChangeAmount: Dispatch<SetStateAction<string>>;
  total: number;
  paymentMethod: string;
  changeAmount: string;
  needsChange: boolean;
};

export function PaymentMethod({
  setPaymentMethod,
  setNeedsChange,
  setChangeAmount,
  total,
  paymentMethod,
  changeAmount,
  needsChange,
}: Props) {
  return (
    <GlassCard>
      <GlassCardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <CreditCard className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">
            Forma de Pagamento
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <GlassCard
            className={`border-2 transition-all cursor-pointer ${
              paymentMethod === "credit"
                ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
            onClick={() => setPaymentMethod("credit")}
          >
            <GlassCardContent className="p-4 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-semibold text-gray-900">Cartão de Crédito</p>
              <p className="text-xs text-gray-600">Seguro</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard
            className={`border-2 transition-all cursor-pointer ${
              paymentMethod === "debit"
                ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
            onClick={() => setPaymentMethod("debit")}
          >
            <GlassCardContent className="p-4 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold text-gray-900">Cartão de Débito</p>
              <p className="text-xs text-gray-600">Seguro</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard
            className={`border-2 transition-all cursor-pointer ${
              paymentMethod === "pix"
                ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
            onClick={() => setPaymentMethod("pix")}
          >
            <GlassCardContent className="p-4 text-center">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-semibold text-gray-900">PIX</p>
              <p className="text-xs text-gray-600">Instantâneo</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard
            className={`border-2 transition-all cursor-pointer ${
              paymentMethod === "cash"
                ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
            onClick={() => setPaymentMethod("cash")}
          >
            <GlassCardContent className="p-4 text-center">
              <Banknote className="h-8 w-8 mx-auto mb-2 text-amber-600" />
              <p className="font-semibold text-gray-900">Dinheiro</p>
              <p className="text-xs text-gray-600">Na entrega</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard
            className={`border-2 transition-all cursor-pointer ${
              paymentMethod === "bank_transfer"
                ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
            onClick={() => setPaymentMethod("bank_transfer")}
          >
            <GlassCardContent className="p-4 text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
              <p className="font-semibold text-gray-900">Transferência</p>
              <p className="text-xs text-gray-600">Bancária</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Informações específicas de cada método de pagamento */}
        {(paymentMethod === "credit" || paymentMethod === "debit") && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-2">
                  Pagamento Seguro com{" "}
                  {paymentMethod === "credit"
                    ? "Cartão de Crédito"
                    : "Cartão de Débito"}
                </p>
                <p className="text-sm text-blue-700 mb-3">
                  Após confirmar o pedido, você será redirecionado para uma
                  página segura de pagamento. Seus dados bancários são
                  protegidos por criptografia de ponta.
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Não coletamos ou armazenamos dados do seu cartão</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "pix" && (
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Smartphone className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold text-green-700 mb-2">
              Pagamento via PIX
            </p>
            <p className="text-sm text-green-600">
              Após confirmar o pedido, você receberá o código PIX para pagamento
              instantâneo.
            </p>
          </div>
        )}

        {paymentMethod === "cash" && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <Banknote className="h-12 w-12 mx-auto mb-3 text-amber-600" />
              <p className="font-semibold text-amber-700 mb-2">
                Pagamento em Dinheiro
              </p>
              <p className="text-sm text-amber-600">
                Pague em dinheiro diretamente ao entregador no momento da
                entrega.
              </p>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsChange"
                  checked={needsChange}
                  onCheckedChange={(checked) => {
                    setNeedsChange(checked as boolean);
                    if (!checked) setChangeAmount("");
                  }}
                />
                <Label
                  htmlFor="needsChange"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Precisa de troco?
                </Label>
              </div>

              {needsChange && (
                <div className="space-y-2 pl-6">
                  <Label
                    htmlFor="changeAmount"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Troco para quanto? *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <Input
                      id="changeAmount"
                      type="number"
                      step="0.01"
                      min={total + 0.01}
                      placeholder={(total + 10).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(e.target.value)}
                      className="pl-10 rounded-xl border-2 border-gray-200 focus:border-amber-500"
                    />
                  </div>
                  {changeAmount && parseFloat(changeAmount) <= total && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />O valor precisa ser
                      maior que o total do pedido ({formatCurrency(total)})
                    </p>
                  )}
                  {changeAmount && parseFloat(changeAmount) > total && (
                    <p className="text-xs text-green-600">
                      Troco: {formatCurrency(parseFloat(changeAmount) - total)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {paymentMethod === "bank_transfer" && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <p className="font-semibold text-indigo-900">
                Dados para Transferência
              </p>
            </div>

            <div className="space-y-3 bg-white rounded-lg p-4 border border-indigo-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Banco</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Banco Inter
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Agência</p>
                  <p className="text-sm font-semibold text-gray-900">0001</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Conta</p>
                  <p className="text-sm font-semibold text-gray-900">
                    12345678-9
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tipo</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Conta Corrente
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">CNPJ</p>
                <p className="text-sm font-semibold text-gray-900">
                  12.345.678/0001-90
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Favorecido</p>
                <p className="text-sm font-semibold text-gray-900">
                  Like Delivery LTDA
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 text-xs text-indigo-700 bg-indigo-100 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Após realizar a transferência, envie o comprovante para
                confirmar seu pagamento. O pedido será processado após a
                confirmação.
              </p>
            </div>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
