"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, type User } from "@/services/api";
import { useAuthStore } from "@/stores";
import { formatPhone, formatPhoneRegex } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 20;

function getInitial(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

function formatCustomerPhone(phone?: string) {
  if (!phone) return null;
  return formatPhoneRegex(formatPhone(phone)) || phone;
}

function formatCustomerSince(customer: User) {
  // O contrato de /user não é consistente entre createdAt e created_at -
  // lê os dois em vez de assumir um só.
  const raw =
    customer.createdAt || (customer as { created_at?: string }).created_at;
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Rota dedicada à tela financeira de clientes (ver pagination.md): já vem
  // paginada e ordenada por nome, sem usuários excluídos. Antes essa tela
  // derivava a lista varrendo todas as páginas de pedidos da empresa, o que
  // só enxergava quem já tinha comprado e exibia o UUID no lugar do nome.
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["financial", "customers", page],
    queryFn: async () => {
      const response = await apiService.getCompanyCustomers({
        page,
        limit: PAGE_SIZE,
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || "Falha ao carregar clientes");
      }
      return response.data;
    },
    enabled: !!isAuthenticated,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const customers = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  // A rota não expõe busca por texto, então o filtro age só sobre a página
  // carregada - a tela deixa isso explícito em vez de fingir busca global.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((field) =>
        field?.toLowerCase().includes(query),
      ),
    );
  }, [customers, search]);

  const goToPage = (target: number) => {
    setPage(Math.min(Math.max(target, 1), totalPages));
    setSearch("");
  };

  return (
    <AdminPageLayout
      title="Clientes"
      icon={Users}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-64 lg:pr-8"
      actions={
        <span className="rounded-[8px] border border-[#E9EAEE] bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#3D4149]">
          {total} cliente{total !== 1 ? "s" : ""}
        </span>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            [...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Total de clientes</p>
                <p className="text-2xl font-bold text-blue-600">{total}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Nesta página</p>
                <p className="text-2xl font-bold text-gray-700">
                  {customers.length}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {search.trim()
              ? `${filtered.length} de ${customers.length} nesta página`
              : "Filtra os clientes da página atual"}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Não foi possível carregar os clientes</p>
              <p className="text-sm mt-1">Tente novamente em instantes</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum cliente encontrado</p>
              {search.trim() && (
                <p className="text-sm mt-1">
                  Nenhum resultado nesta página para “{search.trim()}”
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: lista em cards */}
              <div className="divide-y divide-gray-100 md:hidden">
                {filtered.map((customer) => (
                  <div key={customer.id} className="p-3.5" title={customer.id}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                        {getInitial(customer.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {customer.name || "Cliente"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {customer.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">
                        {formatCustomerPhone(customer.phone) ?? "Sem telefone"}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        Desde {formatCustomerSince(customer)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/tablet: tabela */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Cliente
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        E-mail
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Telefone
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Cliente Desde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((customer) => (
                      <tr
                        key={customer.id}
                        title={customer.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                              {getInitial(customer.name)}
                            </span>
                            <span className="font-medium text-gray-900">
                              {customer.name || "Cliente"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {customer.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatCustomerPhone(customer.phone) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {formatCustomerSince(customer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-4 py-3">
              <span className="text-xs text-gray-500">
                Página {meta?.page ?? page} de {totalPages} ({total} clientes)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isFetching}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || isFetching}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
