"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-provider";
import { useAuthStore } from "@/stores";
import { isCompanyRole } from "@/utils/role-helpers";
import clsx from "clsx";
import {
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LikeDeliveryLogo } from "../ui/likedelivery-logo";

interface MainHeaderProps {
  cartItems?: number;
  onCartClick?: () => void;
  showSearch?: boolean;
  showNav?: boolean;
}

export function MainHeader({
  cartItems = 0,
  onCartClick,
  showSearch = true,
  showNav = true,
}: MainHeaderProps) {
  const router = useRouter();
  const { showAuthModal, logout } = useAuth();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isMounted, setIsMounted] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Montagem do componente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Espera a store terminar de rehydrar do localStorage
  useEffect(() => {
    // Já rehydratou?
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    // Escuta quando terminar de rehydrar
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => {
      unsub();
    };
  }, []);

  const canShowAuthUI = isMounted && hasHydrated;

  const handleProfileClick = () => {
    if (isCompanyRole(user?.role)) {
      router.push("/company-profile");
    } else {
      router.push("/profile");
    }
    setMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    if (onCartClick) onCartClick();
    else router.push("/cart");
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={clsx(
        "fixed top-1 left-1 right-1 z-50",
        "bg-white border border-orange-100/50",
        "rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden",
      )}
    >
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-1">
          {/* Logo + Endereço */}
          <div className="flex items-center gap-1 flex-col">
            <LikeDeliveryLogo>LikeDelivery</LikeDeliveryLogo>
            <div className="leading-tight">
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[140px]">
                  Rua Machado de Assis, 334
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            {showSearch && (
              <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-0 bg-gray-50/50"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="border-b border-orange-100">
                  <div className="mt-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        autoFocus
                        placeholder="Buscar comida..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-gray-50/50 border-0"
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Área de autenticação */}
            {canShowAuthUI && (
              <>
                {isAuthenticated ? (
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-0 bg-gray-50/50 cursor-pointer"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>

                    <SheetContent
                      side="right"
                      className="w-[300px] sm:w-[400px]"
                    >
                      <SheetTitle className="sr-only">
                        Menu de navegação
                      </SheetTitle>

                      <div className="flex flex-col h-full">
                        <div className="flex items-center space-x-2 mb-6">
                          <LikeDeliveryLogo />
                          <h2 className="text-lg font-bold">Menu</h2>
                        </div>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start rounded-xl"
                            onClick={handleProfileClick}
                          >
                            {user?.photoUrl ? (
                              <img
                                src={user.photoUrl}
                                alt={user.name || "User"}
                                className="h-5 w-5 rounded-full object-cover mr-2"
                              />
                            ) : (
                              <User className="h-4 w-4 mr-2" />
                            )}
                            Perfil
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full justify-start rounded-xl"
                            onClick={handleCartClick}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Carrinho
                            {cartItems > 0 && (
                              <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                {cartItems}
                              </span>
                            )}
                          </Button>

                          {user?.role === "client" && (
                            <Button
                              variant="outline"
                              className="w-full justify-start rounded-xl"
                              onClick={() => {
                                router.push("/orders");
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Meus Pedidos
                            </Button>
                          )}

                          {user?.role === "owner" && (
                            <Button
                              variant="outline"
                              className="w-full justify-start rounded-xl"
                              onClick={() => {
                                router.push("/menu-management");
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Store className="h-4 w-4 mr-2" />
                              Gestão
                            </Button>
                          )}

                          <Button
                            className="w-full justify-start rounded-xl text-orange-600 hover:text-orange-700 hover:bg-red-50"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair da conta
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-0 bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium"
                    onClick={() => showAuthModal("login")}
                  >
                    Entrar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
