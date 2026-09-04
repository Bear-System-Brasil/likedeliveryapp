"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CreditCard,
  Home,
  Receipt,
  Settings
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface LateralMenuProps {
  selectedLabel?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/financial-management/dashboard",
    icon: Home,
  },
  {
    label: "Pedidos",
    href: "/financial-management/orders",
    icon: Receipt,
  },
  {
    label: "Financeiro",
    href: "/financial-management/finance",
    icon: CreditCard,
  },
  // TODO(backend): "Clientes" escondido - ver a nota em
  // sidebar-menu-management. A tela e a rota continuam existindo.
  {
    label: "Configurações",
    href: "/financial-management/settings",
    icon: Settings,
  },
];

export function LateralMenu({ selectedLabel }: LateralMenuProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center border-b px-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">Gestão Financeira</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = selectedLabel === item.label || pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className="cursor-pointer">
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
