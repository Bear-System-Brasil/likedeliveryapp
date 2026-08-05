import {
  CashDepositRequest,
  CashRefundRequest,
  CashSaleRequest,
  CashWithdrawalRequest,
} from "@/services/api";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SUMMARY_KEY = ["cash-movement", "summary"];

export const useCashMovementSummary = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: async () => {
      const response = await apiService.cashMovement.getSummary();
      if (!response.success) {
        if (
          response.message?.includes("404") ||
          response.message?.includes("não encontrado")
        ) {
          return null;
        }
        throw new Error(response.message || "Erro ao buscar resumo do caixa");
      }
      return response.data ?? null;
    },
    enabled: !!token,
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: false,
  });
};

export const useCashWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CashWithdrawalRequest) =>
      apiService.cashMovement.withdrawal(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
        toast.success("Sangria registrada com sucesso!");
      } else {
        toast.error(response.message || "Erro ao registrar sangria");
      }
    },
    onError: () => toast.error("Erro de conexão ao registrar sangria"),
  });
};

export const useCashDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CashDepositRequest) =>
      apiService.cashMovement.deposit(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
        toast.success("Suprimento registrado com sucesso!");
      } else {
        toast.error(response.message || "Erro ao registrar suprimento");
      }
    },
    onError: () => toast.error("Erro de conexão ao registrar suprimento"),
  });
};

export const useCashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CashSaleRequest) => apiService.cashMovement.sale(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
        toast.success("Venda manual registrada!");
      } else {
        toast.error(response.message || "Erro ao registrar venda");
      }
    },
    onError: () => toast.error("Erro de conexão ao registrar venda"),
  });
};

export const useCashRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CashRefundRequest) =>
      apiService.cashMovement.refund(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
        toast.success("Reembolso registrado com sucesso!");
      } else {
        toast.error(response.message || "Erro ao registrar reembolso");
      }
    },
    onError: () => toast.error("Erro de conexão ao registrar reembolso"),
  });
};
