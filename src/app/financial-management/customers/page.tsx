"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService, toPaginated, type CompanyCustomer } from "@/services/api";
import { useAuthStore } from "@/stores";
import { formatPhone, formatPhoneDisplay } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 20;

function getInitial(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

// `phone` vem cru do backend ("86236074543"). `formatPhone` tira o +55 e o
// que não for dígito; `formatPhoneDisplay` é a máscara (00) 00000-0000 que o
// projeto já aplica em order-status, company-profile e restaurant-register.
function formatCustomerPhone(phone?: string) {
  if (!phone) return null;
  return formatPhoneDisplay(formatPhone(phone)) || null;
}

// A rota manda `created_at`, em snake_case - não o `createdAt` do /user.
function formatCustomerSince(customer: CompanyCustomer) {
  if (!customer.created_at) return "—";
  const date = new Date(customer.created_at);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Foto do cliente com recuo para a inicial do nome.
 *
 * O recuo cobre dois casos: `photoUrl` vazio e URL que existe mas não
 * carrega (host fora do ar, objeto removido). Sem o `onError` o segundo
 * caso deixaria o ícone de imagem quebrada na tabela.
 *
 * É `<img>` e não `next/image` de propósito: o host das fotos não está
 * todo no remotePatterns do next.config, e ali um host não listado derruba
 * a página em runtime. É o mesmo que o main-header faz com a foto do
 * usuário logado.
 */
function CustomerAvatar({
  customer,
  className,
}: {
  customer: CompanyCustomer;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!customer.photoUrl && !failed;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-400 ${className}`}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={customer.photoUrl}
          alt={customer.name || "Cliente"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitial(customer.name)
      )}
    </span>
  );
}

export default function CustomersPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Rota dedicada à tela financeira de clientes (ver pagination.md): já vem
  // paginada e ordenada por nome, sem usuários excluídos. Antes essa tela
  // derivava a lista varrendo todas as páginas de pedidos da empresa, o que
  // só enxergava quem já tinha comprado e exibia o UUID no lugar do nome.
  //
  // A resposta é o envelope `{ data, meta }`: a lista está em
  // `response.data.data` e o total em `response.data.meta.total`. Ler
  // `response.data` como array é o que deixa a tela vazia - `toPaginated`
  // resolve os dois formatos.
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["financial", "customers", page],
    queryFn: async () => {
      const params = { page, limit: PAGE_SIZE };
      const response = await apiService.getCompanyCustomers(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Falha ao carregar clientes");
      }
      return toPaginated<CompanyCustomer>(response.data, params);
    },
    enabled: !!isAuthenticated,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const customers = useMemo(() => data?.items ?? [], [data]);
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
        <span className="rounded-[8px] border border-border bg-card px-2.5 py-1 text-[11.5px] font-bold text-foreground">
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
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Total de clientes</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{total}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Nesta página</p>
                <p className="text-2xl font-bold text-foreground">
                  {customers.length}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {search.trim()
              ? `${filtered.length} de ${customers.length} nesta página`
              : "Filtra os clientes da página atual"}
          </p>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Não foi possível carregar os clientes</p>
              <p className="text-sm mt-1">Tente novamente em instantes</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
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
              <div className="divide-y divide-border md:hidden">
                {filtered.map((customer) => (
                  <div key={customer.id} className="p-3.5" title={customer.id}>
                    <div className="flex items-center gap-3">
                      <CustomerAvatar customer={customer} className="h-9 w-9 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {customer.name || "Cliente"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatCustomerPhone(customer.phone) ?? "Sem telefone"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Desde {formatCustomerSince(customer)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/tablet: tabela */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Cliente
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        E-mail
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Telefone
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Cliente Desde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((customer) => (
                      <tr
                        key={customer.id}
                        title={customer.id}
                        className="hover:bg-muted transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <CustomerAvatar customer={customer} className="h-8 w-8 text-xs" />
                            <span className="font-medium text-foreground">
                              {customer.name || "Cliente"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {customer.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatCustomerPhone(customer.phone) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
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
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">
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
