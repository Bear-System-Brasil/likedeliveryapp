"use client";

import {
  Home,
  ShoppingCart,
  ClipboardList,
  User,
  Store,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-provider";
import { useAuthStore } from "@/stores";
import { useEffect, useState } from "react";
import { useCartActions } from "@/hooks";

interface BottomBarProps {
  activeTab: "home" | "cart" | "orders" | "profile" | "management";
}

type Tab = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: boolean;
};

export function BottomBar({ activeTab }: BottomBarProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { user: storeUser } = useAuthStore();
  const { totalItems } = useCartActions();
  const [isMounted, setIsMounted] = useState(false);

  const user = storeUser || authUser;
  const isOwner = user?.role === "owner" || user?.role === "company";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Não renderiza nada até ter o user (evita o flash)
  if (!isMounted || !user) {
    return null; // ou um skeleton simples se preferir
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
    { id: "orders", label: "Pedidos", icon: ClipboardList, href: "/orders" },
    { id: "profile", label: "Perfil", icon: User, href: "/profile" },
  ];

  const ownerTabs: Tab[] = [
    { id: "home", label: "Início", icon: Home, href: "/" },
    {
      id: "management",
      label: "Gestão",
      icon: Store,
      href: "/menu-management",
    },
    { id: "profile", label: "Perfil", icon: User, href: "/profile" },
  ];

  const tabs = isOwner ? ownerTabs : clientTabs;
  const gridCols = tabs.length === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden ">
      <div className={`grid h-15 ${gridCols}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isActive ? "text-orange-500" : "text-gray-500"
              }`}
            >
              {tab.badge && (
                <span className="absolute top-2 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
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
                <div className="absolute top-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-b-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
