"use client";

import { useAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface RoleCheckProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  /** Se true, redireciona ao invés de só esconder o conteúdo (uso: guarda de página) */
  redirectOnFail?: boolean;
  redirectTo?: string;
}

/**
 * Componente para renderizar conteúdo apenas se o usuário tiver a role adequada.
 *
 * - Uso como esconde/mostra UI (ex: botão no footer): usar sem redirectOnFail.
 * - Uso como guarda de página inteira (ex: /menu-management): passar
 *   redirectOnFail para mandar o usuário pro login em vez de ficar em branco.
 *
 * @example
 * <RoleCheck allowedRoles={['owner', 'admin']}>
 *   <button>Gerenciar Cardápio</button>
 * </RoleCheck>
 *
 * @example
 * <RoleCheck allowedRoles={['owner', 'admin']} redirectOnFail>
 *   <PaginaInteira />
 * </RoleCheck>
 */
export default function RoleCheck({
  children,
  allowedRoles,
  fallback = null,
  redirectOnFail = false,
  redirectTo = "/?openAuth=true",
}: RoleCheckProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = user?.role || null;
  const isAllowed = !!(
    isAuthenticated &&
    user &&
    userRole &&
    allowedRoles.includes(userRole)
  );

  // Mesmo useEffect/router.push do padrão já usado no company-profile
  useEffect(() => {
    if (mounted && redirectOnFail && !isAllowed) {
      router.push(redirectTo);
    }
  }, [mounted, redirectOnFail, isAllowed, router, redirectTo]);

  if (!mounted) {
    return null;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}