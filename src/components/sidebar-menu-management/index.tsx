"use client";

import Link from "next/link";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  LayoutGrid,
  CreditCard,
  Building2,
  TrendingUp,
  UtensilsCrossed,
  ClipboardList,
  MapPin,
  ShoppingBag,
  User,
  Globe,
  UserPlus,
  X,
  ChefHat,
  LayoutDashboard,
  Users,
  Settings,
  ThumbsUp,
  House,
  Wallet,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navGroups = [
  {
    label: "Principal",
    links: [{ href: "/", label: "home", icon: House }],
  },
  {
    label: "Gestão",
    links: [
      { href: "/menu-management", label: "Cardápio", icon: UtensilsCrossed },
      { href: "/category-management", label: "Categorias", icon: LayoutGrid },
      {
        href: "/order-management",
        label: "Gerenciar Pedidos",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Financeiro",
    links: [
      {
        href: "/financial-management/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/financial-management/finance",
        label: "Finanças",
        icon: TrendingUp,
      },
      {
        href: "/financial-management/cash-register",
        label: "Caixa",
        icon: Wallet,
      },
      {
        href: "/financial-management/orders",
        label: "Pedidos",
        icon: ClipboardList,
      },
      {
        href: "/financial-management/customers",
        label: "Clientes",
        icon: Users,
      },
      {
        href: "/financial-management/settings",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
  {
    label: "Restaurante",
    links: [
      {
        href: "/restaurant-landing-page",
        label: "Página Pública",
        icon: Globe,
      },
      { href: "/company-profile", label: "Perfil da Empresa", icon: Building2 },
      {
        href: "/restaurant-register",
        label: "Cadastrar Restaurante",
        icon: UserPlus,
      },
      { href: "/restaurants", label: "Restaurantes", icon: ChefHat },
    ],
  },
  {
    label: "Conta",
    links: [
      { href: "/company-profile", label: "Meu Perfil", icon: User },
      { href: "/checkout", label: "Checkout", icon: CreditCard },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-500 to-orange-500 flex items-center justify-center">
            <ThumbsUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight">
            Like Delivery
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4 cursor-pointer" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                      active
                        ? "bg-linear-to-r from-orange-500 to-orange-500 text-white font-medium shadow-sm shadow-orange-200"
                        : "text-gray-600 hover:bg-orange-50 hover:text-orange-600",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-white" : "text-gray-400",
                      )}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 text-center">v1.0.0</p>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) {
    return (
      <aside className="fixed top-0 left-0 h-full w-64 border-r border-gray-100 shadow-sm z-40">
        <SidebarContent />
      </aside>
    );
  }

  return (
    <SheetPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetPrimitive.Portal>
        <SheetPrimitive.Content
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-64 border-r border-gray-100 shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-left-8 data-[state=open]:duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-left-8 data-[state=closed]:duration-200",
          )}
        >
          <SheetPrimitive.Title asChild>
            <VisuallyHidden.Root>Menu de navegação</VisuallyHidden.Root>
          </SheetPrimitive.Title>
          <SidebarContent onClose={onClose} />
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
