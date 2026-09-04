"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CreditCard,
  Home,
  Menu,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
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
  {
    label: "Caixa",
    href: "/financial-management/cash-register",
    icon: Wallet,
  },
  // TODO(backend): "Clientes" escondido - ver a nota em
  // sidebar-menu-management. A tela e a rota continuam existindo.
  {
    label: "Configurações",
    href: "/financial-management/settings",
    icon: Settings,
  },
];

export function Sidebar({ selectedLabel }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="flex h-14 sm:h-16 items-center border-b px-4 sm:px-6">
        <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="ml-2 text-base sm:text-lg font-semibold">
          Gestão Financeira
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3 sm:p-4">
        {sidebarItems.map((item) => {
          const isActive =
            selectedLabel === item.label || pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="cursor-pointer"
              onClick={() => setMobileOpen(false)}
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start cursor-pointer",
                  isActive && "bg-primary text-primary-foreground",
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </>
  );


  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col bg-white border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-20 left-4 z-40 h-10 w-10 rounded-xl bg-white shadow-lg cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
