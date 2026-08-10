"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayment } from "@/hooks";
import { Payment, PaymentMethod, PaymentStatus } from "@/services/api";
import { formatCurrency } from "@/utils";
import {
  Calendar,
  Check,
  DollarSign,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function FinancePage() {
  const {
    payments,
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

  // Filters state
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

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalAmount: 0,
    completedAmount: 0,
  });

  /**
   * Calcular estatísticas dos pagamentos
   */
  useEffect(() => {
    const total = payments.length;
    const pending = payments.filter((p) => isPending(p)).length;
    const completed = payments.filter((p) => isCompleted(p)).length;
    const failed = payments.filter((p) => isFailed(p)).length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedAmount = payments
      .filter((p) => isCompleted(p))
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      total,
      pending,
      completed,
      failed,
      totalAmount,
      completedAmount,
    });
  }, [payments, isPending, isCompleted, isFailed]);

  /**
   * Carregar todos os pagamentos ao montar
   */
  useEffect(() => {
    handleSearch();
  }, []);

  /**
   * Aplicar filtros de busca
   */
  const handleSearch = async () => {
    if (dateFrom && dateTo) {
      // Buscar por período
      await fetchPaymentsByDateRange({
        startDate: new Date(dateFrom).toISOString(),
        endDate: new Date(dateTo).toISOString(),
        customerId: searchCustomerId || undefined,
      });
    } else if (filterMethod !== "ALL") {
      // Buscar por método
      await fetchPaymentsByMethod(filterMethod);
    } else {
      // Buscar por filtros gerais
      const filters: any = {};
      if (searchOrderId) filters.orderId = searchOrderId;
      if (searchCustomerId) filters.customerId = searchCustomerId;

      if (Object.keys(filters).length > 0) {
        await fetchPaymentsByFilters(filters);
      } else {
        // Se não tem filtro algum, buscar todos - vamos usar um filtro vazio
        await fetchPaymentsByFilters({});
      }
    }
  };

  /**
   * Limpar filtros
   */
  const handleClearFilters = () => {
    setFilterMethod("ALL");
    setFilterStatus("ALL");
    setSearchOrderId("");
    setSearchCustomerId("");
    setDateFrom("");
    setDateTo("");
    fetchPaymentsByFilters({});
  };

  /**
   * Filtrar pagamentos pelo status selecionado
   */
  const filteredPayments =
    filterStatus === "ALL"
      ? payments
      : payments.filter((p) => p.status === filterStatus);

  /**
   * Obter cor do badge baseado no status
   */
  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case PaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case PaymentStatus.FAILED:
        return "bg-red-100 text-red-800";
      case PaymentStatus.CANCELLED:
        return "bg-gray-100 text-gray-800";
      case PaymentStatus.REFUNDED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /**
   * Obter ícone do método de pagamento
   */
  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PIX:
        return "🔲";
      case PaymentMethod.CREDIT_CARD:
        return "💳";
      case PaymentMethod.DEBIT_CARD:
        return "💳";
      case PaymentMethod.CASH:
        return "💵";
      case PaymentMethod.BANK_TRANSFER:
        return "🏦";
      default:
        return "💰";
    }
  };

  /**
   * Aprovar pagamento
   */
  const handleApprove = async (payment: Payment) => {
    await approvePayment(payment.id, `TXN-${Date.now()}`);
    handleSearch();
  };

  /**
   * Rejeitar pagamento
   */
  const handleReject = async (payment: Payment) => {
    await rejectPayment(payment.id);
    handleSearch();
  };

  /**
   * Reembolsar pagamento
   */
  const handleRefund = async (payment: Payment) => {
    await refundPayment(payment.id);
    handleSearch();
  };

  return (
    <AdminPageLayout
      title="Gestão de Pagamentos"
      icon={DollarSign}
      mainClassName="p-4 pb-10 sm:p-6 lg:pl-64 lg:pr-8"
    >
      <div className="max-w-7xl mx-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Total de Pagamentos
                </span>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Concluídos</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.completedAmount)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pendentes</span>
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-500 mt-1">Aguardando aprovação</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Falhados</span>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-gray-500 mt-1">Não processados</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="font-semibold">Filtros</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento
                </label>
                <Select
                  value={filterMethod}
                  onValueChange={(value) =>
                    setFilterMethod(value as PaymentMethod | "ALL")
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Todos os métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os métodos</SelectItem>
                    <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value={PaymentMethod.DEBIT_CARD}>
                      Cartão de Débito
                    </SelectItem>
                    <SelectItem value={PaymentMethod.CASH}>Dinheiro</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>
                      Transferência
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) =>
                    setFilterStatus(value as PaymentStatus | "ALL")
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os status</SelectItem>
                    <SelectItem value={PaymentStatus.PENDING}>
                      Pendente
                    </SelectItem>
                    <SelectItem value={PaymentStatus.COMPLETED}>
                      Concluído
                    </SelectItem>
                    <SelectItem value={PaymentStatus.FAILED}>
                      Falhado
                    </SelectItem>
                    <SelectItem value={PaymentStatus.CANCELLED}>
                      Cancelado
                    </SelectItem>
                    <SelectItem value={PaymentStatus.REFUNDED}>
                      Reembolsado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Pedido
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por pedido"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Cliente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente"
                    value={searchCustomerId}
                    onChange={(e) => setSearchCustomerId(e.target.value)}
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSearch}
                className="rounded-xl bg-linear-to-r from-orange-500 to-pink-500"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="rounded-xl"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">
                Pagamentos Encontrados ({filteredPayments.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum pagamento encontrado</p>
                <p className="text-sm mt-1">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {getMethodIcon(payment.paymentMethod)}
                          </span>
                          <div>
                            <p className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>
                            Pedido:{" "}
                            <span className="font-mono text-xs">
                              {payment.orderId.slice(0, 8)}...
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Cliente:{" "}
                            <span className="font-mono text-xs">
                              {payment.customerId.slice(0, 8)}...
                            </span>
                          </span>
                          {payment.transaction && (
                            <>
                              <span>•</span>
                              <span>
                                Transação:{" "}
                                <span className="font-mono text-xs">
                                  {payment.transaction}
                                </span>
                              </span>
                            </>
                          )}
                          {payment.date && (
                            <>
                              <span>•</span>
                              <span>
                                {new Date(payment.date).toLocaleString("pt-BR")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(payment.status)}>
                          {getPaymentStatusLabel(payment.status)}
                        </Badge>

                        {isPending(payment) && (
                          <div className="flex gap-2 ml-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(payment)}
                              className="bg-green-600 hover:bg-green-700 rounded-xl"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(payment)}
                              className="border-red-600 text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {isCompleted(payment) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefund(payment)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl ml-2"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reembolsar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </AdminPageLayout>
  );
}
