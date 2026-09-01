import {
  CashDepositRequest,
  CashMovementListParams,
  CashRefundRequest,
  CashSaleRequest,
  CashWithdrawalRequest,
  toPaginated,
} from "@/services/api";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

const SUMMARY_KEY = ["cash-movement", "summary"];
const LIST_KEY = ["cash-movement", "list"];

/** Todo movimento novo muda o resumo E o extrato - invalida os dois. */
const invalidateCashMovement = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
  queryClient.invalidateQueries({ queryKey: LIST_KEY });
};

export const useCashMovementSummary = () => {
  const { isAuthenticated } = useAuthStore();

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
    enabled: !!isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: false,
  });
};

/**
 * Extrato paginado de movimentos do caixa (GET /cash-movement).
 *
 * Existe para o operador investigar linha a linha uma diferença no
 * fechamento: os totais do resumo vêm líquidos e não dizem QUAL lançamento
 * criou a diferença. Filtros opcionais - sem nenhum, lista tudo.
 */
export const useCashMovements = (
  params?: CashMovementListParams,
  options?: { enabled?: boolean },
) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [...LIST_KEY, params ?? {}],
    queryFn: async () => {
      const response = await apiService.cashMovement.list(params);
      if (!response.success) {
        throw new Error(
          response.message || "Erro ao buscar movimentos do caixa",
        );
      }
      return toPaginated(response.data, params);
    },
    enabled: !!isAuthenticated && (options?.enabled ?? true),
    staleTime: 15_000,
    retry: false,
    // Trocar de página/filtro mantém a tabela anterior no lugar em vez de
    // piscar o esqueleto inteiro a cada request.
    placeholderData: (previousData) => previousData,
  });
};

export const useCashWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CashWithdrawalRequest) =>
      apiService.cashMovement.withdrawal(data),
    onSuccess: (response) => {
      if (response.success) {
        invalidateCashMovement(queryClient);
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
        invalidateCashMovement(queryClient);
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
        invalidateCashMovement(queryClient);
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
        invalidateCashMovement(queryClient);
        toast.success("Reembolso registrado com sucesso!");
      } else {
        toast.error(response.message || "Erro ao registrar reembolso");
      }
    },
    onError: () => toast.error("Erro de conexão ao registrar reembolso"),
  });
};
