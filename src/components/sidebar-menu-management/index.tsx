"use client";

import { cn } from "@/lib/utils";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  ChefHat,
  ClipboardList,
  CreditCard,
  House,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Settings,
  ThumbsUp,
  TrendingUp,
  User,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { LikeDeliveryLogo } from "../ui/likedelivery-logo";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NavLink = {
  href: string;
  label: string;
  icon: typeof House;
  /**
   * Sem role = visível para qualquer usuário autenticado.
   *
   * Isto é visibilidade de menu, não autorização: quem decide o acesso é o
   * ROUTE_PERMISSIONS + middleware. A lista aqui é subconjunto do que a role
   * pode abrir - nunca deve listar rota que ela não acessa, senão o item
   * leva direto pro "Acesso Negado".
   */
  roles?: string[];
};

const navGroups: { label: string; links: NavLink[] }[] = [
  {
    label: "Principal",
    links: [{ href: "/", label: "Início", icon: House }],
  },
  {
    label: "Gestão",
    links: [
      {
        href: "/menu-management",
        label: "Cardápio",
        icon: UtensilsCrossed,
        roles: ["owner", "admin", "manager"],
      },
      {
        href: "/category-management",
        label: "Categorias",
        icon: LayoutGrid,
        roles: ["owner", "admin", "manager"],
      },
      {
        href: "/order-management",
        label: "Gerenciar Pedidos",
        icon: ClipboardList,
        roles: ["owner", "admin", "manager"],
      },
      {
        href: "/kitchen",
        label: "Cozinha",
        icon: ChefHat,
        roles: ["owner", "admin", "manager", "cook"],
      },
      {
        href: "/team-management",
        label: "Equipe",
        icon: UserCog,
        roles: ["owner", "admin", "manager"],
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
        roles: ["owner", "admin", "financial"],
      },
      {
        href: "/financial-management/finance",
        label: "Finanças",
        icon: TrendingUp,
        roles: ["owner", "admin", "financial"],
      },
      {
        href: "/financial-management/cash-register",
        label: "Caixa",
        icon: Wallet,
        roles: ["owner", "admin", "financial"],
      },
      {
        href: "/financial-management/orders",
        label: "Pedidos",
        icon: ClipboardList,
        roles: ["owner", "admin", "financial"],
      },
      {
        href: "/financial-management/customers",
        label: "Clientes",
        icon: Users,
        roles: ["owner", "admin", "financial"],
      },
      {
        href: "/financial-management/settings",
        label: "Configurações",
        icon: Settings,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Conta",
    links: [
      {
        href: "/company-profile",
        label: "Meu Perfil",
        icon: User,
        roles: ["owner", "admin"],
      },
      {
        href: "/profile",
        label: "Perfil",
        icon: User,
        roles: ["manager", "cook", "delivery", "financial", "client"],
      },
      {
        href: "/checkout",
        label: "Checkout",
        icon: CreditCard,
        roles: ["owner", "admin", "manager"],
      },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    logout();
    router.push("/");
    onClose?.();
  };

  // Sem role carregada ainda (SSR/primeira hidratação): não mostra nada que
  // dependa de permissão, só o que é livre para qualquer autenticado.
  const canSee = (link: NavLink) => !link.roles || (!!user?.role && link.roles.includes(user.role));

  const visibleGroups = navGroups
    .map((group) => ({ ...group, links: group.links.filter(canSee) }))
    .filter((group) => group.links.length > 0);

  return (
    <div className="flex h-full flex-col bg-white text-[#14161A]">
      <div className="flex shrink-0 items-center justify-between px-[18px] py-4">
        <Link href="/" className="shrink-0">
          <LikeDeliveryLogo>LikeDelivery</LikeDeliveryLogo>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#A0A6B0] transition-colors hover:bg-[#F7F8FA] hover:text-[#3D4149]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mt-4 first:mt-3">
            <p className="mb-2 px-3 text-[10.5px] font-extrabold uppercase tracking-normal text-[#A9AFB9]">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex h-[38px] items-center gap-[11px] rounded-[14px] px-3 text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-[#FF6B00] text-white shadow-[0_6px_14px_rgba(255,107,0,0.35)]"
                        : "text-[#3B4B66] hover:bg-[#F7F8FA] hover:text-[#14161A]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-white" : "text-[#A0A6B0]",
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[#E9EAEE] px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-[38px] w-full items-center gap-[11px] rounded-[14px] bg-[#FF6B00] px-3 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(255,107,0,0.35)] transition-colors hover:bg-[#FF8A33] cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Sair da conta</span>
        </button>
      </div>

      <div className="shrink-0 border-t border-[#E9EAEE] px-[18px] py-3.5 text-center text-[10.5px] font-semibold text-[#A2A7B0]">
        v1.0.0
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-full w-[220px] border-r border-[#E9EAEE] bg-white">
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
        <SheetPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/50",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <SheetPrimitive.Content
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-[220px] border-r border-[#E9EAEE] bg-white shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-left-8 data-[state=open]:duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-left-8 data-[state=closed]:duration-200",
          )}
        >
          <SheetPrimitive.Title asChild>
            <span className="sr-only">Menu de navegação</span>
          </SheetPrimitive.Title>
          <SidebarContent onClose={onClose} />
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
