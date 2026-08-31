"use client";

import {
  ClipboardList,
  Home,
  LogIn,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";

import { useAuth } from "@/contexts/auth-provider";
import { useCartActions } from "@/hooks";
import { useAuthStore } from "@/stores";
import { isCompanyRole } from "@/utils/role-helpers";

type BottomTabId =
  | "home"
  | "cart"
  | "orders"
  | "profile"
  | "management"
  | "login";

interface BottomBarProps {
  activeTab?: BottomTabId;
}

type Tab = {
  id: BottomTabId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  badge?: boolean;
  protected?: boolean;
  // Ex: "Entrar" pro visitante anônimo - abre o modal de login no lugar,
  // sem navegar pra rota nenhuma.
  onSelect?: () => void;
};

const managementRoutes = [
  "/menu-management",
  "/category-management",
  "/order-management",
  "/financial-management",
];

// Fluxos focados que ja possuem barra de acao fixa no rodape (checkout) ou
// cabecalho proprio com as acoes do papel (entregador), e a tela da cozinha
// (operacional, sem espaço vertical de sobra) - a nav do cliente (carrinho,
// pedidos de cliente etc.) não faz sentido sobreposta ali.
const hiddenRoutes = ["/checkout", "/delivery-dashboard", "/kitchen"];

function getActiveTab(pathname: string): BottomTabId {
  if (pathname === "/cart" || pathname.startsWith("/checkout")) return "cart";

  if (pathname.startsWith("/orders") || pathname.startsWith("/order-status")) {
    return "orders";
  }

  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/company-profile")
  ) {
    return "profile";
  }

  if (managementRoutes.some((route) => pathname.startsWith(route))) {
    return "management";
  }

  return "home";
}

export function BottomBar({ activeTab }: BottomBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, showAuthModal } = useAuth();
  const { user: storeUser, isAuthenticated } = useAuthStore();
  const { totalItems } = useCartActions();
  const [isMounted, setIsMounted] = useState(false);

  const user = storeUser || authUser;
  const isOwner = isCompanyRole(user?.role);
  const currentTab = activeTab || getActiveTab(pathname);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (hiddenRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const clientTabs: Tab[] = [
    { id: "home", label: "Início", icon: Home, href: "/" },
    {
      id: "cart",
      label: "Carrinho",
      icon: ShoppingCart,
      href: "/cart",
      badge: true,
    },
    {
      id: "orders",
      label: "Pedidos",
      icon: ClipboardList,
      href: "/orders",
      protected: true,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      href: "/profile",
      protected: true,
    },
  ];

  const ownerTabs: Tab[] = [
    { id: "home", label: "Início", icon: Home, href: "/" },
    {
      id: "management",
      label: "Gestão",
      icon: Store,
      href: "/menu-management",
      protected: true,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      href: "/company-profile",
      protected: true,
    },
  ];

  // Visitante anônimo: mesmas abas de navegação do cliente, menos as que só
  // fazem sentido com conta. "Pedidos" some (não existe pedido sem login) e
  // "Perfil" vira "Entrar", abrindo o login direto (sem navegar/redirecionar)
  // em vez de simular uma aba que só existe pra mandar de volta pro login.
  const guestTabs: Tab[] = clientTabs
    .filter((tab) => tab.id !== "orders")
    .map((tab) =>
      tab.id === "profile"
        ? {
            id: "login" as const,
            label: "Entrar",
            icon: LogIn,
            onSelect: () => showAuthModal("login"),
          }
        : tab,
    );

  const tabs = isOwner ? ownerTabs : isAuthenticated ? clientTabs : guestTabs;
  const gridCols = tabs.length === 4 ? "grid-cols-4" : "grid-cols-3";

  const handleNavigate = (tab: Tab) => {
    if (tab.onSelect) {
      tab.onSelect();
      return;
    }

    if (tab.protected && !user) {
      router.push("/?openAuth=true");
      return;
    }

    if (tab.href) router.push(tab.href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className={`grid h-16 ${gridCols}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNavigate(tab)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isActive ? "text-orange-500" : "text-gray-500"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.badge && (
                <span className="absolute right-1/4 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}

              <Icon
                className={`h-5 w-5 transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              />

              <span
                className={`text-[10px] ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <div className="absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-b-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
