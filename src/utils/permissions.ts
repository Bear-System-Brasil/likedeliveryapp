/**
 * Permission map by route
 * Defines which roles have access to each page
 */

export const ROUTE_PERMISSIONS: { [key: string]: string[] } = {
  // Public pages (everyone can access)
  "/": ["owner", "admin", "manager", "cook", "delivery", "financial", "client"],
  "/restaurants": ["owner", "admin", "manager", "cook", "delivery", "financial", "client"],
  "/restaurant/[id]": ["owner", "admin", "manager", "cook", "delivery", "financial", "client"],

  // Client pages
  "/cart": ["client"],
  "/checkout": ["client"],
  "/order-status": ["client", "delivery"],

  // Menu management (restaurant)
  "/menu-management": ["owner", "admin", "manager"],
  "/category-management": ["owner", "admin", "manager"],

  // Order management
  "/order-management": ["owner", "admin", "manager", "cook"],
  "/kitchen": ["owner", "admin", "manager", "cook"],

  // Financial management
  "/financial-management": ["owner", "admin", "financial"],
  "/financial-management/dashboard": ["owner", "admin", "financial"],
  "/financial-management/orders": ["owner", "admin", "financial"],
  "/financial-management/customers": ["owner", "admin", "financial"],
  "/financial-management/finance": ["owner", "admin", "financial"],
  "/financial-management/settings": ["owner", "admin", "financial"],

  // Company profile (owner and admin)
  "/company-profile": ["owner", "admin"],

  // Profile (all authenticated users)
  "/profile": ["owner", "admin", "manager", "cook", "delivery", "financial", "client"],
};

/**
 * Roles disponíveis no sistema
 */
export const USER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  COOK: "cook",
  DELIVERY: "delivery",
  FINANCIAL: "financial",
  CLIENT: "client",
} as const;

/**
 * Labels amigáveis para os roles
 */
export const ROLE_LABELS: { [key: string]: string } = {
  owner: "Dono",
  admin: "Administrador",
  manager: "Gerente",
  cook: "Cozinheiro",
  delivery: "Entregador",
  financial: "Financeiro",
  client: "Cliente",
};

/**
 * Descrição dos roles
 */
export const ROLE_DESCRIPTIONS: { [key: string]: string } = {
  owner: "Proprietário do restaurante com acesso total",
  admin: "Administrador com acesso a todas as funcionalidades",
  manager: "Gerente com acesso à gestão operacional",
  cook: "Cozinheiro com acesso aos pedidos em produção",
  delivery: "Entregador com acesso aos pedidos para entrega",
  financial: "Financeiro com acesso à gestão financeira",
  client: "Cliente com acesso ao catálogo e pedidos",
};

/**
 * Check if a role has permission to access a route
 */
export function hasRoutePermission(route: string, userRole: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route];

  if (!allowedRoles) {
    // If route is not mapped, block for security
    return false;
  }

  return allowedRoles.includes(userRole);
}

/**
 * Retorna as rotas que um role pode acessar
 */
export function getAccessibleRoutes(userRole: string): string[] {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([route]) => route);
}

/**
 * Verifica se um usuário é dono/admin/gerente (tem acesso administrativo)
 */
export function isRestaurantStaff(userRole: string): boolean {
  return ["owner", "admin", "manager"].includes(userRole);
}

/**
 * Verifica se um usuário é cliente
 */
export function isClient(userRole: string): boolean {
  return userRole === "client";
}
