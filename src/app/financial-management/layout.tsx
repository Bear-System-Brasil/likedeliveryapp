"use client";

import ProtectedRoute from "@/components/protected-route";
import { ROUTE_PERMISSIONS } from "@/utils/permissions";

/**
 * Guard client-side de TODAS as telas de /financial-management/*.
 *
 * A lista vem do mapa de permissões em vez de ser repetida aqui: enquanto
 * era literal, ficou com ["owner", "admin"] e sem `financial`. O middleware
 * e o ROUTE_PERMISSIONS liberavam a rota, e então este layout barrava e
 * empurrava pra /unauthorized - o "Acesso Negado" aparecia para uma conta
 * com role e companyId corretos no token. Ler do mapa mantém as duas
 * camadas de front em sincronia por construção.
 */
const ALLOWED_ROLES = ROUTE_PERMISSIONS["/financial-management"] ?? [
  "owner",
  "admin",
  "financial",
];

export default function FinancialManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRoles={ALLOWED_ROLES}>{children}</ProtectedRoute>;
}
