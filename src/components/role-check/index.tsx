"use client";

import { useAuth } from "@/contexts/auth-provider";
import { ReactNode, useEffect, useState } from "react";

interface RoleCheckProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

/**
 * Componente para renderizar conteúdo apenas se o usuário tiver a role adequada
 * 
 * @example
 * <RoleCheck allowedRoles={['owner', 'admin']}>
 *   <button>Gerenciar Cardápio</button>
 * </RoleCheck>
 */
export default function RoleCheck({ children, allowedRoles, fallback = null }: RoleCheckProps) {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const userRole = user.role || null;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
